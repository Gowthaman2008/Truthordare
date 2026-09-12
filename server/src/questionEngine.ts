import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Question, GameSettings, Difficulty } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class QuestionEngine {
  private truths: Question[] = [];
  private dares: Question[] = [];

  constructor() {
    this.loadQuestions();
  }

  private loadQuestions() {
    try {
      const truthsPath = path.join(__dirname, 'data', 'truths.json');
      const daresPath = path.join(__dirname, 'data', 'dares.json');

      if (fs.existsSync(truthsPath)) {
        const raw = fs.readFileSync(truthsPath, 'utf-8');
        this.truths = JSON.parse(raw);
      }
      if (fs.existsSync(daresPath)) {
        const raw = fs.readFileSync(daresPath, 'utf-8');
        this.dares = JSON.parse(raw);
      }
      console.log(`[QuestionEngine] Loaded ${this.truths.length} Truths and ${this.dares.length} Dares.`);
    } catch (err) {
      console.error('[QuestionEngine] Error loading questions:', err);
    }
  }

  public getRandomQuestion(
    type: 'truth' | 'dare',
    settings: GameSettings,
    usedQuestionIds: string[],
    customQuestions: Question[] = []
  ): Question {
    // 1. Gather candidate custom questions matching type
    const matchingCustom = customQuestions.filter(q => q.type === type && !usedQuestionIds.includes(q.id));
    
    // 35% chance to prioritize an unused custom question if available
    if (matchingCustom.length > 0 && Math.random() < 0.35) {
      const selected = matchingCustom[Math.floor(Math.random() * matchingCustom.length)];
      return selected;
    }

    // 2. Base pool by type
    let pool = type === 'truth' ? [...this.truths] : [...this.dares];

    // 3. Filter by category if specific categories are chosen and match >= 10 questions
    if (settings.categories && settings.categories.length > 0) {
      const catFiltered = pool.filter(q => 
        settings.categories.some(c => 
          q.category.toLowerCase().includes(c.toLowerCase()) || 
          c.toLowerCase().includes(q.category.toLowerCase())
        )
      );
      if (catFiltered.length >= 10) {
        pool = catFiltered;
      }
    }

    // 4. Filter by difficulty if specified and not 'All'
    if (settings.difficulty && settings.difficulty !== 'All') {
      const diffFiltered = pool.filter(q => q.difficulty === settings.difficulty);
      if (diffFiltered.length >= 10) {
        pool = diffFiltered;
      }
    }

    // 5. Filter by Game Mode rules (with broad flexible matching)
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

    // 6. Exclude previously used questions
    let unused = pool.filter(q => !usedQuestionIds.includes(q.id));

    // If all questions in this sub-pool were used, fall back to unused from the full type pool
    if (unused.length === 0) {
      const fullPool = type === 'truth' ? this.truths : this.dares;
      unused = fullPool.filter(q => !usedQuestionIds.includes(q.id));
    }

    // If STILL all 1,200 questions in the entire library have been used, reset pool
    if (unused.length === 0) {
      unused = type === 'truth' ? this.truths : this.dares;
    }

    // Fallback if somehow pool is empty
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

    // Uniform random pick from unused questions
    const randomIndex = Math.floor(Math.random() * unused.length);
    return unused[randomIndex];
  }

  public getCategories(type: 'truth' | 'dare'): string[] {
    const pool = type === 'truth' ? this.truths : this.dares;
    const cats = new Set(pool.map(p => p.category));
    return Array.from(cats);
  }

  public getTotalCounts() {
    return {
      truths: this.truths.length,
      dares: this.dares.length,
      total: this.truths.length + this.dares.length
    };
  }
}
