import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

@Injectable()
export class AssetService {
  private readonly polyPizzaKey = process.env.POLY_PIZZA_API_KEY;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Cache-first search strategy:
   * 1. Query our DB (Cloudinary-backed assets) first.
   * 2. Also query Poly Pizza for fresh results.
   * 3. Return both: library (already saved) + polyResults (with `cached` flag).
   */
  async searchAssets(query: string, user: any) {
    // 1. Check our own asset library first
    // Teacher sees their institution's assets OR public assets.
    // Super Admins see everything (if user.role === 'SUPER_ADMIN')
    const whereClause: any = {
      name: { contains: query, mode: 'insensitive' },
    };
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.OR = [
        { institutionId: user.institutionId },
        { isPublic: true },
      ];
    }

    const library = await this.prisma.asset3D.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    // 2. Query Poly Pizza for fresh results
    let polyResults: any[] = [];
    try {
      const { data } = await axios.get(
        `https://api.poly.pizza/v1/search/${encodeURIComponent(query)}`,
        { headers: { 'X-Auth-Token': this.polyPizzaKey } },
      );
      polyResults = data?.results ?? [];
    } catch (err) {
      console.error('[AssetService] Poly Pizza search failed:', err?.message);
    }

    // 3. Mark which Poly Pizza results are already in our library
    const cachedIds = new Set(library.map((a) => a.sourceId));
    const annotatedPolyResults = polyResults.map((item) => ({
      ...item,
      cached: cachedIds.has(item.ID),
    }));

    return { library, polyResults: annotatedPolyResults };
  }

  async getLibrary(page = 1, limit = 20, user: any) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.OR = [
        { institutionId: user.institutionId },
        { isPublic: true },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.asset3D.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.asset3D.count({ where: whereClause }),
    ]);
    return { items, total, page, limit };
  }

  async saveAsset(data: {
    name: string;
    sourceId: string;
    downloadUrl: string;
    thumbnailUrl: string;
    authorName?: string;
    license?: string;
    attribution?: string;
  }, user: any) {
    // Determine ownership
    const institutionId = user.role === 'SUPER_ADMIN' ? null : user.institutionId;
    const isPublic = user.role === 'SUPER_ADMIN'; // Admins save globally
    const directory = user.role === 'SUPER_ADMIN' ? 'global' : user.institutionId;

    // Idempotency: return existing asset if already saved for this institution/global
    const existing = await this.prisma.asset3D.findFirst({
      where: { sourceId: data.sourceId, institutionId },
    });
    if (existing) return existing;

    try {
      const [glbBuffer, thumbBuffer] = await Promise.all([
        axios.get<Buffer>(data.downloadUrl, {
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TinyMinds/1.0)' },
        }).then(r => Buffer.from(r.data)),
        axios.get<Buffer>(data.thumbnailUrl, {
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TinyMinds/1.0)' },
        }).then(r => Buffer.from(r.data)),
      ]);

      const uploadBuffer = (buffer: Buffer, options: Record<string, unknown>): Promise<any> =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
          stream.end(buffer);
        });

      const folderPrefix = institutionId ? `tinyminds/institutions/${institutionId}` : `tinyminds/global/${directory}`;
      
      const [modelUpload, thumbUpload] = await Promise.all([
        uploadBuffer(glbBuffer, {
          resource_type: 'raw',
          folder: folderPrefix,
          public_id: `poly_${data.sourceId}`,
          overwrite: false,
        }),
        uploadBuffer(thumbBuffer, {
          resource_type: 'image',
          folder: folderPrefix,
          public_id: `poly_${data.sourceId}_thumb`,
          overwrite: false,
        }),
      ]);

      const asset = await this.prisma.asset3D.create({
        data: {
          name: data.name,
          source: 'POLY_PIZZA',
          sourceId: data.sourceId,
          modelUrl: modelUpload.secure_url,
          thumbnailUrl: thumbUpload.secure_url,
          fileType: 'glb',
          authorName: data.authorName,
          license: data.license,
          attribution: data.attribution,
          institutionId,
          isPublic,
        },
      });

      return asset;
    } catch (error) {
      console.error('[AssetService] Failed to save 3D asset:', error?.message ?? error);
      throw new InternalServerErrorException('Failed to upload asset to Cloudinary');
    }
  }

  async uploadAsset(
    body: { name: string; directory?: string },
    modelFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File | undefined,
    user: any,
  ) {
    const institutionId = user.role === 'SUPER_ADMIN' ? null : user.institutionId;
    const isPublic = user.role === 'SUPER_ADMIN'; // Default global assets to public
    const directory = user.role === 'SUPER_ADMIN' ? (body.directory || 'global') : user.institutionId;
    const folderPrefix = institutionId ? `tinyminds/institutions/${institutionId}` : `tinyminds/global/${directory}`;
    const uniqueSuffix = Date.now().toString() + Math.round(Math.random() * 1e9);

    // Extract extension
    const originalName = modelFile.originalname || 'file';
    const lastDot = originalName.lastIndexOf('.');
    const ext = lastDot !== -1 ? originalName.substring(lastDot + 1) : 'bin';

    // Set resource type based on mimetype (images/videos vs raw files)
    let resourceType = 'raw';
    if (modelFile.mimetype.startsWith('image/')) resourceType = 'image';
    if (modelFile.mimetype.startsWith('video/')) resourceType = 'video';

    try {
      const uploadBuffer = (buffer: Buffer, options: Record<string, unknown>): Promise<any> =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
          stream.end(buffer);
        });

      const uploadTasks: Promise<any>[] = [
        uploadBuffer(modelFile.buffer, {
          resource_type: resourceType,
          folder: folderPrefix,
          public_id: `manual_${uniqueSuffix}.${ext}`,
        }),
      ];

      if (thumbnailFile) {
        uploadTasks.push(
          uploadBuffer(thumbnailFile.buffer, {
            resource_type: 'image',
            folder: folderPrefix,
            public_id: `manual_${uniqueSuffix}_thumb`,
          }),
        );
      }

      const [modelUpload, thumbUpload] = await Promise.all(uploadTasks);

      const asset = await this.prisma.asset3D.create({
        data: {
          name: body.name,
          source: 'MANUAL',
          modelUrl: modelUpload.secure_url,
          thumbnailUrl: thumbUpload?.secure_url,
          fileType: ext,
          institutionId,
          isPublic,
        },
      });

      return asset;
    } catch (error) {
      console.error('[AssetService] Manual upload failed:', error?.message ?? error);
      throw new InternalServerErrorException('Failed to manually upload asset');
    }
  }
}