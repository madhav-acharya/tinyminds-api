import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AuthGuard } from '../common/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  /**
   * GET /assets/search?q=apple
   * Returns: { library: Asset3D[], polyResults: PolyPizzaItem[] }
   * library = already saved (Cloudinary), polyResults = fresh from Poly Pizza (with `cached` flag)
   */
  @Get('search')
  search(@Query('q') q: string) {
    if (!q?.trim()) return { library: [], polyResults: [] };
    return this.assetService.searchAssets(q);
  }

  /**
   * GET /assets/library?page=1&limit=20
   * Returns all assets that have been saved to Cloudinary.
   */
  @Get('library')
  getLibrary(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.assetService.getLibrary(Number(page), Number(limit));
  }

  /**
   * POST /assets/save
   * Teacher clicks a Poly Pizza result → save to Cloudinary → persist in DB.
   */
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
  ) {
    return this.assetService.saveAsset(body);
  }
}
