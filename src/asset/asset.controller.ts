import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
    @Req() req: any,
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
    @Req() req: any,
  ) {
    return this.assetService.saveAsset(body, req.user);
  }

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'model', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { storage: memoryStorage() },
    ),
  )
  uploadAsset(
    @Req() req: any,
    @Body() body: { name: string; directory?: string },
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      model?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    const mainFile = files.file?.[0] ?? files.model?.[0];
    if (!mainFile) {
      throw new BadRequestException('A file is required');
    }
    return this.assetService.uploadAsset(
      body,
      mainFile,
      files.thumbnail?.[0],
      req.user,
    );
  }
}
