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
  async searchAssets(query: string) {
    // 1. Check our own asset library first
    const library = await this.prisma.asset3D.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
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

  /**
   * Get all assets in our library (paginated).
   */
  async getLibrary(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.asset3D.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.asset3D.count(),
    ]);
    return { items, total, page, limit };
  }

  /**
   * Save a Poly Pizza asset to Cloudinary + DB.
   * If already saved (same sourceId), returns the existing record immediately.
   */
  async saveAsset(data: {
    name: string;
    sourceId: string;
    downloadUrl: string;
    thumbnailUrl: string;
    authorName?: string;
    license?: string;
    attribution?: string;
  }) {
    // Idempotency: return existing asset if already saved
    const existing = await this.prisma.asset3D.findFirst({
      where: { sourceId: data.sourceId },
    });
    if (existing) return existing;

    try {
      // Download the .glb and thumbnail as buffers from Poly Pizza
      // (Cloudinary's remote-fetch gets 403 from their CDN, so we proxy it ourselves)
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

      // Upload buffers to Cloudinary via upload_stream
      const uploadBuffer = (
        buffer: Buffer,
        options: Record<string, unknown>,
      ): Promise<any> =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
          stream.end(buffer);
        });

      const [modelUpload, thumbUpload] = await Promise.all([
        uploadBuffer(glbBuffer, {
          resource_type: 'raw',
          folder: 'tinyminds/3d-models',
          public_id: `poly_${data.sourceId}`,
          overwrite: false,
        }),
        uploadBuffer(thumbBuffer, {
          resource_type: 'image',
          folder: 'tinyminds/thumbnails',
          public_id: `poly_${data.sourceId}_thumb`,
          overwrite: false,
        }),
      ]);

      // Persist metadata in PostgreSQL
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
        },
      });

      return asset;
    } catch (error) {
      console.error('[AssetService] Failed to save 3D asset:', error?.message ?? error);
      throw new InternalServerErrorException('Failed to upload asset to Cloudinary');
    }
  }
}
