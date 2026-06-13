import { Controller, Get, Post, Body, Query, UseGuards, Req, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AssetService } from './asset.service';
import { AuthGuard } from '../common/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get('search')
  search(@Query('q') q: string, @Req() req: any) {
    if (!q?.trim()) return { library: [], polyResults: [] };
    return this.assetService.searchAssets(q, req.user);
  }

  @Get('library')
  getLibrary(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Req() req: any
  ) {
    return this.assetService.getLibrary(Number(page), Number(limit), req.user);
  }

  @Post('save')
  saveAsset(
    @Body()
    body: {
      name: string;
      sourceId: string;
      downloadUrl: string;
      thumbnailUrl: string;
      authorName?: string;
      license?: string;
      attribution?: string;
    },
    @Req() req: any
  ) {
    return this.assetService.saveAsset(body, req.user);
  }

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'model', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  uploadAsset(
    @Req() req: any,
    @Body() body: { name: string; directory?: string },
    @UploadedFiles()
    files: {
      model?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    if (!files.model || !files.model.length) {
      throw new BadRequestException('3D model file is required');
    }
    return this.assetService.uploadAsset(
      body,
      files.model[0],
      files.thumbnail?.[0],
      req.user,
    );
  }
}

