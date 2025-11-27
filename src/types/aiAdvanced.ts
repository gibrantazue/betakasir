// Advanced AI Features Types

export type DiagramType = 'flowchart' | 'mindmap' | 'timeline' | 'orgchart' | 'pie' | 'bar' | 'line';

export interface Diagram {
  id: string;
  type: DiagramType;
  title: string;
  data: any;
  mermaidCode?: string; // For flowcharts, mindmaps
  chartConfig?: any; // For charts
  createdAt: Date;
}

export interface Infographic {
  id: string;
  title: string;
  sections: InfoSection[];
  style: 'modern' | 'minimal' | 'colorful';
  createdAt: Date;
}

export interface InfoSection {
  type: 'stat' | 'comparison' | 'timeline' | 'list';
  title: string;
  data: any;
  icon?: string;
  color?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  category: 'kasir' | 'produk' | 'karyawan' | 'bisnis' | 'umum';
  difficulty: 'mudah' | 'sedang' | 'sulit';
  createdAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: UserAnswer[];
  completedAt: Date;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number; // seconds
}

export interface DeepResearch {
  id: string;
  query: string;
  status: 'analyzing' | 'researching' | 'completed' | 'failed';
  progress: number; // 0-100
  findings: ResearchFinding[];
  summary: string;
  recommendations: string[];
  sources: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface ResearchFinding {
  title: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
  data?: any;
}

export interface Canvas {
  id: string;
  title: string;
  type: 'brainstorm' | 'strategy' | 'planning' | 'analysis';
  elements: CanvasElement[];
  connections: CanvasConnection[];
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasElement {
  id: string;
  type: 'note' | 'idea' | 'task' | 'data' | 'image';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  metadata?: any;
}

export interface CanvasConnection {
  id: string;
  from: string; // element id
  to: string; // element id
  type: 'arrow' | 'line' | 'dashed';
  label?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: 'kasir' | 'produk' | 'karyawan' | 'laporan' | 'bisnis';
  difficulty: 'pemula' | 'menengah' | 'lanjutan';
  lessons: Lesson[];
  progress: number; // 0-100
  estimatedTime: number; // minutes
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  type: 'video' | 'text' | 'interactive' | 'quiz';
  duration: number; // minutes
  completed: boolean;
  resources?: LessonResource[];
}

export interface LessonResource {
  type: 'pdf' | 'video' | 'link' | 'image';
  title: string;
  url: string;
}

export interface InteractiveTutorial {
  id: string;
  title: string;
  steps: TutorialStep[];
  currentStep: number;
  completed: boolean;
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: string; // What user should do
  target?: string; // Element to highlight
  validation?: () => boolean; // Check if step completed
  hint?: string;
}
