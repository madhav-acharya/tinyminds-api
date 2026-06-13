import { ContentType, ContentStatus } from '../dto/create-content.dto';

export class ContentEntity {
  id: string;
  moduleId: string;
  teacherId: string;
  title: string;
  description: string;
  body: string;
  mediaUrl: string;
  type: ContentType;
  status: ContentStatus;
  totalMarks: number;
  durationSec: number;
  createdAt: Date;
  updatedAt: Date;
}
