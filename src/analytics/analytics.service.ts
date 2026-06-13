import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getLearnerInterests(learnerId: string) {
    // 1. Fetch all submissions for the learner
    const submissions = await this.prisma.contentSubmission.findMany({
      where: {
        learnerId,
        status: { in: ['SUBMITTED', 'PASSED', 'FAILED'] },
      },
      include: {
        content: {
          include: {
            module: true,
          },
        },
        answers: true,
      },
    });

    if (!submissions || submissions.length === 0) {
      return [];
    }

    // 2. Group by Module
    const moduleMap = new Map<string, any>();

    for (const sub of submissions) {
      const mod = sub.content.module;
      if (!mod) continue;

      if (!moduleMap.has(mod.id)) {
        moduleMap.set(mod.id, {
          moduleId: mod.id,
          moduleTitle: mod.title,
          totalSubmissions: 0,
          totalScore: 0,
          totalPossibleScore: 0,
          correctAnswers: 0,
          totalAnswers: 0,
          lastActivityAt: sub.submittedAt || sub.updatedAt,
        });
      }

      const entry = moduleMap.get(mod.id);
      entry.totalSubmissions += 1;
      entry.totalScore += sub.score;
      entry.totalPossibleScore += sub.totalMarks;
      
      // Update last activity if more recent
      const subTime = new Date(sub.submittedAt || sub.updatedAt).getTime();
      const currentLastActivity = new Date(entry.lastActivityAt).getTime();
      if (subTime > currentLastActivity) {
        entry.lastActivityAt = sub.submittedAt || sub.updatedAt;
      }

      for (const ans of sub.answers) {
        entry.totalAnswers += 1;
        if (ans.isCorrect) {
          entry.correctAnswers += 1;
        }
      }
    }

    // 3. Convert Map to array and calculate metrics
    const results = Array.from(moduleMap.values()).map(entry => {
      // Engagement Level could be based on number of submissions
      let engagementLevel = 'LOW';
      if (entry.totalSubmissions >= 10) engagementLevel = 'HIGH';
      else if (entry.totalSubmissions >= 5) engagementLevel = 'MEDIUM';

      // Proficiency = correct / total answers
      const proficiencyScore = entry.totalAnswers > 0 
        ? Math.round((entry.correctAnswers / entry.totalAnswers) * 100) 
        : 0;

      return {
        moduleId: entry.moduleId,
        moduleTitle: entry.moduleTitle,
        totalSubmissions: entry.totalSubmissions,
        engagementLevel,
        proficiencyScore,
        lastActivityAt: entry.lastActivityAt,
      };
    });

    // 4. Sort by engagement (totalSubmissions desc) then proficiency desc
    results.sort((a, b) => {
      if (b.totalSubmissions !== a.totalSubmissions) {
        return b.totalSubmissions - a.totalSubmissions;
      }
      return b.proficiencyScore - a.proficiencyScore;
    });

    return results;
  }
}
