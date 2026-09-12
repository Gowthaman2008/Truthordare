import type { Question, GameSettings } from '../types';
import truthsData from '../data/truths.json';
import daresData from '../data/dares.json';

const allTruths: Question[] = (truthsData as unknown as Question[]) || [];
const allDares: Question[] = (daresData as unknown as Question[]) || [];

export class LocalQuestionEngine {
  private truths: Question[] = allTruths;
  private dares: Question[] = allDares;

  public getRandomQuestion(
    type: 'truth' | 'dare',
    settings: GameSettings,
    usedQuestionIds: string[],
    customQuestions: Question[] = []
  ): Question {
    // 1. Prioritize unused custom questions (35% chance)
    const matchingCustom = customQuestions.filter(q => q.type === type && !usedQuestionIds.includes(q.id));
    if (matchingCustom.length > 0 && Math.random() < 0.35) {
      return matchingCustom[Math.floor(Math.random() * matchingCustom.length)];
    }

    // 2. Base pool
    let pool = type === 'truth' ? [...this.truths] : [...this.dares];

    // 3. Category filter
    if (settings.categories && settings.categories.length > 0) {
      const catFiltered = pool.filter(q =>
        settings.categories.some(c =>
          q.category.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(q.category.toLowerCase())
        )
      );
      if (catFiltered.length >= 10) pool = catFiltered;
    }

    // 4. Difficulty filter
    if (settings.difficulty && settings.difficulty !== 'All') {
      const diffFiltered = pool.filter(q => q.difficulty === settings.difficulty);
      if (diffFiltered.length >= 10) pool = diffFiltered;
    }

    // 5. Game mode filter
    if (settings.mode === 'Funny Friends') {
      const funnyFiltered = pool.filter(q =>
        q.category.toLowerCase().includes('funny') ||
        q.category.toLowerCase().includes('teasing') ||
        q.category.toLowerCase().includes('playful')
      );
      if (funnyFiltered.length >= 10) pool = funnyFiltered;
    } else if (settings.mode === 'Best Friends') {
      const bfFiltered = pool.filter(q =>
        q.category.toLowerCase().includes('friendship') ||
        q.category.toLowerCase().includes('secrets') ||
        q.category.toLowerCase().includes('compliments') ||
        q.category.toLowerCase().includes('vibes')
      );
      if (bfFiltered.length >= 10) pool = bfFiltered;
    } else if (settings.mode === 'Getting to Know You') {
      const gtkFiltered = pool.filter(q =>
        q.category.toLowerCase().includes('first impressions') ||
        q.category.toLowerCase().includes('deep feelings') ||
        q.category.toLowerCase().includes('crush') ||
        q.category.toLowerCase().includes('secrets')
      );
      if (gtkFiltered.length >= 10) pool = gtkFiltered;
    } else if (settings.mode === 'Challenge Mode') {
      const chalFiltered = pool.filter(q =>
        q.category.toLowerCase().includes('voice') ||
        q.category.toLowerCase().includes('camera') ||
        q.category.toLowerCase().includes('challenges') ||
        q.difficulty === 'Challenge'
      );
      if (chalFiltered.length >= 10) pool = chalFiltered;
    }

    // 6. Filter used questions
    let unused = pool.filter(q => !usedQuestionIds.includes(q.id));
    if (unused.length === 0) {
      const fullPool = type === 'truth' ? this.truths : this.dares;
      unused = fullPool.filter(q => !usedQuestionIds.includes(q.id));
    }
    if (unused.length === 0) {
      unused = type === 'truth' ? this.truths : this.dares;
    }

    if (unused.length === 0) {
      return {
        id: `fallback_${Date.now()}`,
        type,
        category: 'Flirty & Cute',
        difficulty: 'Normal',
        text: type === 'truth'
          ? 'What is the first thing that attracted you to me?'
          : 'Send a cute 5-second voice note saying something sweet!'
      };
    }

    return unused[Math.floor(Math.random() * unused.length)];
  }

  public getCategories(type: 'truth' | 'dare'): string[] {
    const pool = type === 'truth' ? this.truths : this.dares;
    return Array.from(new Set(pool.map(p => p.category)));
  }

  public getTotalCounts() {
    return {
      truths: this.truths.length,
      dares: this.dares.length,
    };
  }
}

export const localQuestionEngine = new LocalQuestionEngine();
