// src/infrastructure/events/handlers/ItemEventHandlers.ts
// Event handlers for item-related events

/* eslint-disable @typescript-eslint/no-explicit-any */
import { IEventHandler } from '@/core/ports/events/IEventHandler';
import {
  ItemValidationCompletedEvent,
  TextGenerationCompletedEvent,
  TextChunkingCompletedEvent,
  ItemCompletedEvent,
  AudioChunkGeneratedEvent,
} from '@/core/domain/events/item/ItemEvents';
import { QueueManager } from '../../queue/QueueManager';

export class ItemEventHandlers {
  constructor(private readonly queueManager: QueueManager) {}

  handleValidationCompleted(): IEventHandler<ItemValidationCompletedEvent> {
    return {
      handle: async (event: ItemValidationCompletedEvent) => {
        const { itemId } = event.payload;

        console.log('Item validation completed:', itemId);

        // Add to text-generation queue
        const textGenQueue = this.queueManager.getQueue<{ itemId: string }>('text-generation');
        await textGenQueue.enqueue('generate_text', { itemId });
      },
    };
  }

  handleTextGenerationCompleted(): IEventHandler<TextGenerationCompletedEvent> {
    return {
      handle: async (event: TextGenerationCompletedEvent) => {
        const { itemId } = event.payload;

        console.log('Text generation completed:', itemId);

        // Add to text-chunking queue
        const chunkingQueue = this.queueManager.getQueue<{ itemId: string }>('text-chunking');
        await chunkingQueue.enqueue('chunk_text', { itemId });
      },
    };
  }

  handleTextChunkingCompleted(): IEventHandler<TextChunkingCompletedEvent> {
    return {
      handle: async (event: TextChunkingCompletedEvent) => {
        const { itemId, chunkCount } = event.payload;

        console.log('Text chunking completed:', itemId, `(${chunkCount} chunks)`);

        // In a real implementation, we would fetch chunks and enqueue each one
        // For now, we'll skip the audio queue assignment
      },
    };
  }

  handleAudioChunkGenerated(): IEventHandler<AudioChunkGeneratedEvent> {
    return {
      handle: async (event: AudioChunkGeneratedEvent) => {
        const { itemId, chunkIndex } = event.payload;

        console.log('Audio chunk generated:', itemId, `chunk ${chunkIndex}`);

        // In a real implementation, we would check if all chunks are done
        // and then add to merge queue
        // For now, this would be handled by tracking completed chunks
      },
    };
  }

  handleItemCompleted(): IEventHandler<ItemCompletedEvent> {
    return {
      handle: async (event: ItemCompletedEvent) => {
        const { itemId, jobId } = event.payload;

        console.log('Item completed:', itemId, `(job: ${jobId})`);

        // Optionally upload final audio to storage
        // const uploadQueue = this.queueManager.getQueue<{ itemId: string }>('upload');
        // await uploadQueue.enqueue('upload_audio', { itemId });
      },
    };
  }

  // Register all handlers with event bus
  registerHandlers(eventBus: any): void {
    eventBus.subscribe('item.validation_completed', this.handleValidationCompleted());
    eventBus.subscribe('item.text_generation_completed', this.handleTextGenerationCompleted());
    eventBus.subscribe('item.text_chunking_completed', this.handleTextChunkingCompleted());
    eventBus.subscribe('item.audio.chunk.generated', this.handleAudioChunkGenerated());
    eventBus.subscribe('item.completed', this.handleItemCompleted());
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
