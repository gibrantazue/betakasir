// Canvas Service - Collaborative Workspace
import { Canvas, CanvasElement, CanvasConnection } from '../types/aiAdvanced';

class CanvasService {
  private canvases: Map<string, Canvas> = new Map();

  // Create new canvas
  createCanvas(title: string, type: Canvas['type']): Canvas {
    const canvas: Canvas = {
      id: Date.now().toString(),
      title,
      type,
      elements: [],
      connections: [],
      collaborators: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.canvases.set(canvas.id, canvas);
    return canvas;
  }

  // Create canvas from template
  createFromTemplate(templateType: string): Canvas {
    switch (templateType) {
      case 'business-model':
        return this.createBusinessModelCanvas();
      case 'swot':
        return this.createSWOTCanvas();
      case 'strategy':
        return this.createStrategyCanvas();
      case 'brainstorm':
        return this.createBrainstormCanvas();
      default:
        return this.createCanvas('New Canvas', 'brainstorm');
    }
  }

  private createBusinessModelCanvas(): Canvas {
    const canvas = this.createCanvas('Business Model Canvas', 'strategy');
    
    // Add sections
    const sections = [
      { title: 'Key Partners', x: 50, y: 50, color: '#e3f2fd' },
      { title: 'Key Activities', x: 250, y: 50, color: '#fff3e0' },
      { title: 'Value Propositions', x: 450, y: 150, color: '#DC143C' },
      { title: 'Customer Relationships', x: 650, y: 50, color: '#f3e5f5' },
      { title: 'Customer Segments', x: 850, y: 50, color: '#e8f5e9' },
      { title: 'Key Resources', x: 250, y: 250, color: '#fff3e0' },
      { title: 'Channels', x: 650, y: 250, color: '#f3e5f5' },
      { title: 'Cost Structure', x: 250, y: 450, color: '#ffebee' },
      { title: 'Revenue Streams', x: 650, y: 450, color: '#e8f5e9' },
    ];

    sections.forEach((section, index) => {
      canvas.elements.push({
        id: `element-${index}`,
        type: 'note',
        content: section.title,
        position: { x: section.x, y: section.y },
        size: { width: 180, height: 150 },
        color: section.color,
      });
    });

    return canvas;
  }

  private createSWOTCanvas(): Canvas {
    const canvas = this.createCanvas('SWOT Analysis', 'analysis');
    
    const sections = [
      { title: 'Strengths (Kekuatan)', x: 50, y: 50, color: '#e8f5e9', content: '• Apa keunggulan bisnis Anda?\n• Apa yang Anda lakukan lebih baik dari kompetitor?' },
      { title: 'Weaknesses (Kelemahan)', x: 550, y: 50, color: '#ffebee', content: '• Apa yang perlu diperbaiki?\n• Apa yang kompetitor lakukan lebih baik?' },
      { title: 'Opportunities (Peluang)', x: 50, y: 350, color: '#fff3e0', content: '• Tren pasar apa yang bisa dimanfaatkan?\n• Peluang ekspansi apa yang ada?' },
      { title: 'Threats (Ancaman)', x: 550, y: 350, color: '#f3e5f5', content: '• Apa ancaman dari kompetitor?\n• Perubahan pasar apa yang perlu diantisipasi?' },
    ];

    sections.forEach((section, index) => {
      canvas.elements.push({
        id: `element-${index}`,
        type: 'note',
        content: `**${section.title}**\n\n${section.content}`,
        position: { x: section.x, y: section.y },
        size: { width: 450, height: 250 },
        color: section.color,
      });
    });

    return canvas;
  }

  private createStrategyCanvas(): Canvas {
    const canvas = this.createCanvas('Strategy Planning', 'strategy');
    
    canvas.elements.push(
      {
        id: 'vision',
        type: 'note',
        content: '**Vision**\nKemana bisnis akan menuju?',
        position: { x: 400, y: 50 },
        size: { width: 300, height: 100 },
        color: '#DC143C',
      },
      {
        id: 'goals',
        type: 'note',
        content: '**Goals**\nTarget apa yang ingin dicapai?',
        position: { x: 400, y: 200 },
        size: { width: 300, height: 100 },
        color: '#ffc107',
      },
      {
        id: 'strategies',
        type: 'note',
        content: '**Strategies**\nBagaimana cara mencapainya?',
        position: { x: 400, y: 350 },
        size: { width: 300, height: 100 },
        color: '#28a745',
      },
      {
        id: 'actions',
        type: 'note',
        content: '**Action Plans**\nLangkah konkret apa yang akan dilakukan?',
        position: { x: 400, y: 500 },
        size: { width: 300, height: 100 },
        color: '#17a2b8',
      }
    );

    // Add connections
    canvas.connections.push(
      { id: 'c1', from: 'vision', to: 'goals', type: 'arrow' },
      { id: 'c2', from: 'goals', to: 'strategies', type: 'arrow' },
      { id: 'c3', from: 'strategies', to: 'actions', type: 'arrow' }
    );

    return canvas;
  }

  private createBrainstormCanvas(): Canvas {
    const canvas = this.createCanvas('Brainstorming Session', 'brainstorm');
    
    canvas.elements.push({
      id: 'central-idea',
      type: 'idea',
      content: '💡 Ide Utama\n\nTulis ide utama di sini',
      position: { x: 450, y: 300 },
      size: { width: 200, height: 150 },
      color: '#DC143C',
    });

    return canvas;
  }

  // Add element to canvas
  addElement(canvasId: string, element: Omit<CanvasElement, 'id'>): CanvasElement {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) throw new Error('Canvas not found');

    const newElement: CanvasElement = {
      ...element,
      id: `element-${Date.now()}`,
    };

    canvas.elements.push(newElement);
    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);

    return newElement;
  }

  // Update element
  updateElement(canvasId: string, elementId: string, updates: Partial<CanvasElement>) {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) throw new Error('Canvas not found');

    const elementIndex = canvas.elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) throw new Error('Element not found');

    canvas.elements[elementIndex] = {
      ...canvas.elements[elementIndex],
      ...updates,
    };

    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);
  }

  // Delete element
  deleteElement(canvasId: string, elementId: string) {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) throw new Error('Canvas not found');

    canvas.elements = canvas.elements.filter(e => e.id !== elementId);
    canvas.connections = canvas.connections.filter(
      c => c.from !== elementId && c.to !== elementId
    );

    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);
  }

  // Add connection
  addConnection(canvasId: string, connection: Omit<CanvasConnection, 'id'>): CanvasConnection {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) throw new Error('Canvas not found');

    const newConnection: CanvasConnection = {
      ...connection,
      id: `connection-${Date.now()}`,
    };

    canvas.connections.push(newConnection);
    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);

    return newConnection;
  }

  // Get canvas
  getCanvas(id: string): Canvas | undefined {
    return this.canvases.get(id);
  }

  // Get all canvases
  getAllCanvases(): Canvas[] {
    return Array.from(this.canvases.values());
  }

  // Delete canvas
  deleteCanvas(id: string) {
    this.canvases.delete(id);
  }

  // Export canvas as JSON
  exportCanvas(id: string): string {
    const canvas = this.canvases.get(id);
    if (!canvas) throw new Error('Canvas not found');
    return JSON.stringify(canvas, null, 2);
  }

  // Import canvas from JSON
  importCanvas(jsonData: string): Canvas {
    const canvas = JSON.parse(jsonData) as Canvas;
    canvas.id = Date.now().toString(); // New ID
    canvas.createdAt = new Date();
    canvas.updatedAt = new Date();
    this.canvases.set(canvas.id, canvas);
    return canvas;
  }
}

export const canvasService = new CanvasService();
