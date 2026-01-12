# 📍 CARTOGRAPHIE COMPLÈTE DES 403 FICHIERS - RELATIONS & FLUX

## 🎯 ORDRE D'IMPLÉMENTATION (PAR PRIORITÉ)

### ÉTAPE 1: FONDATIONS (Commencer ici)
```
1. shared/config/env.ts
   → Charge toutes les variables d'environnement
   → Utilisé par TOUS les services

2. shared/lib/prisma.ts
   → Singleton PrismaClient
   → Utilisé par TOUS les repositories

3. shared/lib/logger.ts
   → Système de logging
   → Utilisé partout pour logs

4. shared/utils/errors/AppError.ts
   → Classe de base pour erreurs custom
   → Héritée par toutes les erreurs métier

5. shared/utils/errors/ErrorFactory.ts
   → Crée erreurs typées
   → Utilisé par tous les services pour throw errors
```

---

### ÉTAPE 2: DOMAIN LAYER (Logique métier pure)

#### A. Value Objects (pas de dépendances)
```
1. core/domain/value-objects/JobStatus.ts
   → Enum + helpers pour statuts Job
   → Importé par Job entity

2. core/domain/value-objects/ItemStatus.ts
   → Enum + helpers pour statuts Item
   → Importé par ContentItem entity

3. core/domain/value-objects/ChunkStatus.ts
   → Enum pour statuts Chunk
   → Importé par AudioChunk entity

4. core/domain/value-objects/CSVRow.ts
   → Classe pour une ligne CSV avec validation
   → Importé par ContentItem entity

5. core/domain/value-objects/TextChunk.ts
   → Classe pour chunk de texte (max 2000 chars)
   → Importé par ChunkTextUseCase

6. core/domain/value-objects/PromptTemplate.ts
   → Template avec variables {{var}}
   → Méthode render(variables)
   → Importé par GenerateTextUseCase

7. core/domain/value-objects/VoiceSettings.ts
   → Config voix (voiceId, stability, etc.)
   → Importé par Job entity

8. core/domain/value-objects/AudioMetadata.ts
   → Metadata audio (duration, fileSize)
   → Importé par AudioChunk entity
```

#### B. Events (pas de dépendances sauf base)
```
1. core/domain/events/base/DomainEvent.ts
   → Interface de base pour tous les events
   → Étendue par tous les events

2. core/domain/events/base/EventMetadata.ts
   → Metadata event (timestamp, correlationId)
   → Utilisé par DomainEvent

Puis tous les events spécifiques:
- core/domain/events/job/* (17 events)
- core/domain/events/item/* (15 events)
- core/domain/events/chunk/* (4 events)
- core/domain/events/error/* (3 events)

Chaque event:
→ Extend DomainEvent
→ Publié par les Use Cases
→ Écouté par les Event Handlers
```

#### C. Entities (dépendent des Value Objects)
```
1. core/domain/entities/Job.ts
   Importe: JobStatus, VoiceSettings, PromptTemplate
   Méthodes: create(), start(), pause(), complete(), fail()
   → Utilisé par tous les JobUseCases

2. core/domain/entities/ContentItem.ts
   Importe: ItemStatus, CSVRow
   Méthodes: setStatus(), updateStep(), incrementRetry()
   → Utilisé par tous les ContentUseCases

3. core/domain/entities/GeneratedText.ts
   Méthodes: append(), getCharCount()
   → Utilisé par GenerateTextUseCase

4. core/domain/entities/AudioChunk.ts
   Importe: ChunkStatus, AudioMetadata
   → Utilisé par GenerateAudioUseCase

5. core/domain/entities/ChatSession.ts
6. core/domain/entities/ChatMessage.ts
7. core/domain/entities/ErrorLog.ts
8. core/domain/entities/UserSettings.ts
```

---

### ÉTAPE 3: PORTS (Interfaces)

#### A. Repository Interfaces
```
Toutes dans core/ports/repositories/*
→ Définissent les contrats
→ PAS d'implémentation
→ Importées par Use Cases
→ Implémentées par Prisma Repositories

Exemple IJobRepository:
- findById(id): Promise<Job>
- findAll(): Promise<Job[]>
- save(job): Promise<void>
- delete(id): Promise<void>
```

#### B. Service Interfaces
```
Toutes dans core/ports/services/*
→ Définissent contrats services externes
→ Importées par Use Cases
→ Implémentées dans infrastructure/services/

Exemple ITTSService:
- generateAudio(text, voiceId): Promise<Buffer>
- listVoices(): Promise<Voice[]>
```

---

### ÉTAPE 4: INFRASTRUCTURE (Implémentations)

#### A. Repositories Prisma
```
infrastructure/database/repositories/Prisma*Repository.ts

Chaque repository:
→ Importe l'interface du port
→ Importe PrismaClient (shared/lib/prisma.ts)
→ Importe l'entity correspondante
→ Implémente les méthodes du port

Exemple PrismaJobRepository:
Importe: IJobRepository, PrismaClient, Job entity
Implémente: findById, save, etc.
Convertit: Prisma data ↔ Domain entity
```

#### B. Services externes
```
infrastructure/services/ai/mistral/StreamingService.ts
→ Importe ITextGenerationService (port)
→ Utilise fetch pour appeler API Claude
→ Yield des chunks de texte
→ Utilisé par GenerateTextUseCase

infrastructure/services/tts/elevenlabs/ElevenLabsService.ts
→ Importe ITTSService (port)
→ Appelle API InWorld
→ Retourne Buffer audio
→ Utilisé par GenerateAudioForChunkUseCase

infrastructure/services/audio/ffmpeg/FFmpegMergeService.ts
→ Importe IAudioMergeService (port)
→ Utilise child_process pour ffmpeg
→ Merge plusieurs fichiers audio
→ Utilisé par MergeAudioChunksUseCase

infrastructure/services/parsing/csv/CSVParserService.ts
→ Importe ICSVParserService (port)
→ Utilise PapaParse
→ Parse fichier CSV
→ Utilisé par CreateJobFromCSVUseCase

infrastructure/services/parsing/text/SmartTextChunker.ts
→ Importe ITextChunkerService (port)
→ Split texte en chunks <= 2000 chars
→ Utilisé par ChunkTextUseCase

infrastructure/services/storage/local/LocalStorageService.ts
→ Importe IStorageService (port)
→ Utilise fs/promises
→ Sauvegarde fichiers audio localement
→ Utilisé par GenerateAudioUseCase et MergeUseCase
```

#### C. Queue System
```
infrastructure/queue/QueueManager.ts
→ Gère toutes les queues (validation, text-gen, audio-gen, merge)
→ Utilisé par PipelineOrchestrator
→ Dispatch jobs vers workers

infrastructure/queue/InMemoryQueue.ts
→ Implémentation queue simple en mémoire
→ Utilisé par QueueManager

infrastructure/queue/workers/BaseWorker.ts
→ Classe abstraite pour tous les workers
→ Méthode process() à override

infrastructure/queue/workers/TextGenerationWorker.ts
→ Extend BaseWorker
→ Importe GenerateTextUseCase
→ Process un item: exécute use case
→ Gère erreurs et retry

infrastructure/queue/workers/AudioGenerationWorker.ts
→ Extend BaseWorker
→ Importe GenerateAudioForChunkUseCase
→ Process un chunk audio

infrastructure/queue/workers/AudioMergeWorker.ts
→ Extend BaseWorker
→ Importe MergeAudioChunksUseCase
→ Merge tous les chunks d'un item
```

#### D. Event System
```
infrastructure/events/EventBus.ts
→ Implémente IEventBus (port)
→ Pattern pub/sub en mémoire
→ Méthodes: publish(event), subscribe(eventType, handler)
→ Utilisé PARTOUT pour communication

infrastructure/events/handlers/JobEventHandlers.ts
→ Subscribe aux events Job
→ Déclenche actions (ex: JobStarted → add items to queue)
→ Utilisé par PipelineOrchestrator

infrastructure/events/handlers/ItemEventHandlers.ts
→ Subscribe aux events Item
→ Gère transitions entre steps
→ Ex: TextGenerationCompleted → add to chunking queue
```

#### E. Streaming SSE
```
infrastructure/streaming/SSEManager.ts
→ Gère les Server-Sent Events
→ Broadcast updates temps réel vers UI
→ Méthodes: subscribe(channel), broadcast(channel, data)
→ Utilisé par API routes /stream

infrastructure/streaming/channels/JobChannel.ts
→ Channel spécifique pour job progress
→ Broadcast: progress %, completed items, status

infrastructure/streaming/channels/ItemChannel.ts
→ Channel pour item progress + streaming text
```

---

### ÉTAPE 5: USE CASES (Logique applicative)

#### Ordre de création des Use Cases:

##### A. Job Use Cases
```
1. core/domain/use-cases/job/CreateJobFromCSVUseCase.ts
   Importe: IJobRepository, IContentItemRepository, CSVParserService, EventBus
   Flow:
   - Parse CSV
   - Créer Job entity
   - Créer ContentItem entities pour chaque ligne
   - Save en DB
   - Publish JobCreatedEvent
   → Appelé par POST /api/jobs

2. core/domain/use-cases/job/StartJobProcessingUseCase.ts
   Importe: IJobRepository, EventBus
   Flow:
   - Load Job
   - job.start()
   - Save
   - Publish JobStartedEvent
   → JobEventHandler écoute et ajoute items à queue validation

3. core/domain/use-cases/job/PauseJobUseCase.ts
4. core/domain/use-cases/job/ResumeJobUseCase.ts
5. core/domain/use-cases/job/CancelJobUseCase.ts
6. core/domain/use-cases/job/RetryFailedJobItemsUseCase.ts
```

##### B. Content Item Use Cases (pipeline)
```
1. core/domain/use-cases/content/ValidateContentItemUseCase.ts
   Importe: IContentItemRepository, EventBus
   Flow:
   - Load item
   - Valider CSVRow
   - item.setStatus(VALIDATING)
   - Save
   - Publish ItemValidationCompletedEvent
   → ItemEventHandler → add to text-generation queue

2. core/domain/use-cases/content/GenerateTextUseCase.ts
   Importe: IContentItemRepository, ITextGenerationService, EventBus, SSEManager
   Flow:
   - Load item
   - Render prompt template avec variables
   - Stream text generation via AI service
   - Pour chaque chunk:
     * Append au texte
     * Broadcast via SSE
     * Save DB (debounced)
   - Publish TextGenerationCompletedEvent
   → ItemEventHandler → add to chunking queue

3. core/domain/use-cases/content/ChunkTextUseCase.ts
   Importe: IContentItemRepository, ITextChunkerService, EventBus
   Flow:
   - Load item avec generatedText
   - Chunk text via SmartTextChunker
   - Créer TextChunk entities
   - Save
   - Publish TextChunkingCompletedEvent
   → ItemEventHandler → add chaque chunk to audio-generation queue

4. core/domain/use-cases/content/GenerateAudioForChunkUseCase.ts
   Importe: IAudioChunkRepository, ITTSService, IStorageService, EventBus
   Flow:
   - Load chunk
   - Générer audio via InWorld
   - Sauvegarder fichier local
   - Update chunk avec audioPath
   - Save
   - Publish ChunkAudioGeneratedEvent
   → ChunkCoordinator vérifie si tous chunks done → add to merge queue

5. core/domain/use-cases/content/MergeAudioChunksUseCase.ts
   Importe: IContentItemRepository, IAudioMergeService, EventBus
   Flow:
   - Load item + tous ses AudioChunks
   - Merge via FFmpeg
   - Sauvegarder merged audio
   - Update item.finalAudioPath
   - item.setStatus(COMPLETED)
   - Save
   - Publish ItemCompletedEvent
```

##### C. Chat Use Cases
```
core/domain/use-cases/chat/SendMessageUseCase.ts
→ Sauvegarde message user
→ Appelle StreamChatResponseUseCase

core/domain/use-cases/chat/StreamChatResponseUseCase.ts
→ Génère réponse streaming via Claude
→ Parse les actions proposées
→ Broadcast via SSE

core/domain/use-cases/chat/ExecuteToolCallUseCase.ts
→ Exécute une action (generate_csv, validate, start_job, etc.)
→ Appelle le use case correspondant
```

---

### ÉTAPE 6: APPLICATION LAYER (Orchestration)

```
application/orchestrators/PipelineOrchestrator.ts
→ Importe QueueManager, EventBus
→ Setup event handlers pour auto-progression pipeline
→ Ex: ItemValidationCompleted → QueueManager.addJob('text-generation')

application/coordinators/ItemProcessingCoordinator.ts
→ Coordonne le processing d'un item
→ Gère les transitions entre steps

application/coordinators/ChunkProcessingCoordinator.ts
→ Track quels chunks sont done
→ Déclenche merge quand tous done

application/coordinators/ErrorRecoveryCoordinator.ts
→ Gère retry logic
→ Retry depuis un step spécifique

application/workflows/CSVImportWorkflow.ts
→ Workflow complet: upload CSV → validation → création job

application/workflows/TextGenerationWorkflow.ts
→ Workflow: render prompt → generate → save → chunk

application/workflows/AudioGenerationWorkflow.ts
→ Workflow: generer audio chunks → merge → save
```

---

### ÉTAPE 7: DEPENDENCY INJECTION

```
infrastructure/di/Container.ts
→ Map<string, factory function>
→ Méthode register(name, factory)
→ Méthode resolve<T>(name): T

infrastructure/di/config/repositories.config.ts
→ Enregistre tous les repositories
container.register('IJobRepository', () => new PrismaJobRepository(prisma))

infrastructure/di/config/services.config.ts
→ Enregistre tous les services
container.register('ITTSService', () => new ElevenLabsService(apiKey))

infrastructure/di/config/usecases.config.ts
→ Enregistre tous les use cases avec leurs dépendances
container.register('CreateJobUseCase', () => 
  new CreateJobUseCase(
    container.resolve('IJobRepository'),
    container.resolve('IContentItemRepository'),
    container.resolve('EventBus')
  )
)

infrastructure/di/ServiceProvider.ts
→ Initialise le container au démarrage
→ Exporte singleton container
→ Utilisé par les API routes
```

---

### ÉTAPE 8: API ROUTES (Next.js)

```
app/api/jobs/route.ts
POST → CreateJobFromCSVUseCase
GET → Liste jobs

app/api/jobs/[id]/route.ts
GET → GetJobUseCase
PATCH → UpdateJobUseCase
DELETE → DeleteJobUseCase

app/api/jobs/[id]/stream/route.ts
GET → SSE endpoint
→ Subscribe au JobChannel
→ Return ReadableStream

app/api/jobs/import/route.ts
POST → Upload CSV, parse, créer job

app/api/items/[id]/route.ts
GET → Get item details
PATCH → Edit item

app/api/items/[id]/stream/route.ts
GET → SSE pour streaming text

app/api/items/[id]/regenerate/route.ts
POST → RegenerateItemUseCase

app/api/audio/download/[id]/route.ts
GET → Download fichier audio
→ fs.readFile + Response avec audio/mpeg

app/api/chat/route.ts
POST → SendMessageUseCase

app/api/chat/[sessionId]/stream/route.ts
GET → SSE chat streaming

app/api/voices/route.ts
GET → ListAvailableVoicesUseCase

app/api/voices/preview/route.ts
POST → PreviewVoiceUseCase
```

---

### ÉTAPE 9: PRESENTATION LAYER (React)

#### A. State Management
```
presentation/state/stores/uiStore.ts (Zustand)
→ sidebarOpen, currentJobId, selectedVoiceId
→ Uniquement UI state éphémère
→ PAS de data du serveur

presentation/state/queries/jobQueries.ts (React Query)
→ useJob(id), useJobs()
→ useCreateJob(), useStartJob()
→ Cache automatique
→ Invalidation sur mutation
```

#### B. Hooks Custom
```
presentation/hooks/streaming/useStreamingText.ts
→ Subscribe SSE /api/items/[id]/stream
→ Append chunks au state
→ Return { text, isStreaming }

presentation/hooks/jobs/useJobRealtime.ts
→ Subscribe SSE /api/jobs/[id]/stream
→ Update React Query cache en temps réel
→ Pas de polling

presentation/hooks/csv/useCSVImport.ts
→ Upload, parse, validation, création job
→ Gère tout le flow
```

#### C. Components
```
presentation/components/features/csv-import/CSVUploader.tsx
→ Utilise useCSVImport hook
→ File input + drag & drop
→ Affiche preview + erreurs

presentation/components/features/csv-import/CSVPreview.tsx
→ Table avec colonnes CSV
→ Indicateurs validation par cellule

presentation/components/features/job-management/JobList.tsx
→ useJobs() hook
→ Map jobs → JobCard

presentation/components/features/job-management/JobProgress.tsx
→ useJobRealtime(id) hook
→ Progress bar temps réel
→ Liste items avec statuts

presentation/components/features/text-generation/StreamingTextDisplay.tsx
→ useStreamingText(itemId) hook
→ Affiche texte chunk par chunk
→ Curseur animé pendant streaming

presentation/components/features/chat-interface/ChatContainer.tsx
→ useChatSession() hook
→ Layout: messages + input + action buttons

presentation/components/features/chat-interface/MessageBubble.tsx
→ Affiche message
→ Render action buttons si présents
→ onClick button → ExecuteToolCallUseCase
```

---

## 🔄 FLUX COMPLET D'UNE GÉNÉRATION

### 1. Import CSV
```
UI: CSVUploader
↓ file upload
API: POST /api/jobs/import
↓ appelle
UseCase: CreateJobFromCSVUseCase
↓ utilise
Service: CSVParserService (parse)
Repository: JobRepository (save Job)
Repository: ContentItemRepository (save Items)
↓ publie
Event: JobCreatedEvent
↓ redirect
UI: Job Dashboard
```

### 2. Sélection Voix
```
UI: VoiceSelector dans JobDetails
↓ fetch
API: GET /api/voices
↓ appelle
UseCase: ListAvailableVoicesUseCase
↓ utilise
Service: ElevenLabsService.listVoices()
↓ return
UI: Affiche liste + preview
User: Sélectionne voix
↓ save
API: PATCH /api/jobs/[id] {voiceId}
```

### 3. Start Job
```
UI: Click "Start Generation"
↓ mutation
API: POST /api/jobs/[id]/start
↓ appelle
UseCase: StartJobProcessingUseCase
↓ publie
Event: JobStartedEvent
↓ écouté par
Handler: JobEventHandler
↓ pour chaque item
QueueManager.addJob('validation', {itemId})
```

### 4. Pipeline par Item
```
Queue: validation
↓ Worker: ValidationWorker
↓ exécute
UseCase: ValidateContentItemUseCase
↓ publie
Event: ItemValidationCompletedEvent
↓ Handler ajoute à queue
Queue: text-generation
↓ Worker: TextGenerationWorker
↓ exécute
UseCase: GenerateTextUseCase
  → Service: AnthropicStreamingService
  → SSEManager.broadcast(chunks) → UI update temps réel
↓ publie
Event: TextGenerationCompletedEvent
↓ Handler ajoute à queue
Queue: chunking
↓ Worker: TextChunkingWorker
↓ exécute
UseCase: ChunkTextUseCase
  → Service: SmartTextChunker
↓ publie
Event: TextChunkingCompletedEvent
↓ Handler ajoute CHAQUE CHUNK à queue
Queue: audio-generation (parallèle)
↓ Worker: AudioGenerationWorker (5 workers concurrents)
↓ exécute
UseCase: GenerateAudioForChunkUseCase
  → Service: ElevenLabsService.generateAudio()
  → Service: LocalStorageService.saveChunk()
↓ publie
Event: ChunkAudioGeneratedEvent
↓ Coordinator vérifie tous chunks done
↓ si OUI, ajoute à queue
Queue: merge
↓ Worker: AudioMergeWorker
↓ exécute
UseCase: MergeAudioChunksUseCase
  → Service: FFmpegMergeService
  → Service: LocalStorageService.saveMerged()
↓ publie
Event: ItemCompletedEvent
↓ Job incrémente completedItems
↓ Si job.completedItems === job.totalItems
Event: JobCompletedEvent
```

### 5. UI Updates Temps Réel
```
Component: JobProgress
↓ hook
useJobRealtime(jobId)
  → Subscribe SSE /api/jobs/[id]/stream
  → EventSource écoute events
  → Update React Query cache à chaque event
↓ re-render automatique
UI affiche nouveau progress

Component: StreamingTextDisplay
↓ hook
useStreamingText(itemId)
  → Subscribe SSE /api/items/[id]/stream
  → Append chaque chunk au state
↓ re-render à chaque chunk
UI affiche texte progressivement
```

### 6. Error & Retry
```
Si erreur dans un Worker:
→ Log dans ErrorLog table
→ Publish ItemFailedEvent
→ UI affiche erreur + bouton Retry

User click Retry:
→ API: POST /api/items/[id]/retry-step
→ UseCase: RetryItemFromStepUseCase
  - Reset item au step échoué
  - Clear data après ce step
  - Re-add à la queue du step
→ Pipeline reprend
```

---

## 📊 DÉPENDANCES ENTRE MODULES

```
shared/                  → Utilisé par TOUT
  ↓
core/domain/            → Aucune dépendance externe
  ↓
core/ports/             → Dépend seulement de domain
  ↓
infrastructure/         → Implémente ports, utilise domain
  ↓
core/use-cases/         → Utilise ports + domain + publie events
  ↓
application/            → Utilise use-cases + coordonne
  ↓
app/api/                → Utilise DI container pour résoudre use-cases
  ↓
presentation/           → Appelle API + affiche
```

---

## 🚀 PAR OÙ COMMENCER (ORDRE EXACT)

### Jour 1: Setup
1. Configurer .env avec toutes les clés
2. Créer shared/config/env.ts
3. Créer shared/lib/prisma.ts
4. Créer shared/lib/logger.ts
5. Migrer la DB Prisma

### Jour 2-3: Domain
6. Créer tous les Value Objects
7. Créer toutes les Entities
8. Créer tous les Events

### Jour 4: Ports
9. Créer toutes les interfaces repositories
10. Créer toutes les interfaces services

### Jour 5-6: Infrastructure Repositories
11. Implémenter PrismaJobRepository
12. Implémenter PrismaContentItemRepository
13. Implémenter les autres repositories

### Jour 7-8: Infrastructure Services
14. CSVParserService
15. SmartTextChunker
16. AnthropicStreamingService
17. ElevenLabsService
18. FFmpegMergeService
19. LocalStorageService

### Jour 9: Queue System
20. QueueManager
21. InMemoryQueue
22. Tous les Workers

### Jour 10: Event System
23. EventBus
24. Tous les Event Handlers

### Jour 11-12: Use Cases (ordre pipeline)
25. CreateJobFromCSVUseCase
26. StartJobProcessingUseCase
27. ValidateContentItemUseCase
28. GenerateTextUseCase
29. ChunkTextUseCase
30. GenerateAudioForChunkUseCase
31. MergeAudioChunksUseCase
32. Les autres use cases

### Jour 13: Application Layer
33. PipelineOrchestrator
34. Coordinators
35. Workflows

### Jour 14: DI Container
36. Container.ts
37. Tous les .config.ts
38. ServiceProvider.ts

### Jour 15-16: API Routes
39. Toutes les routes /api/jobs/*
40. Toutes les routes /api/items/*
41. Toutes les routes /api/audio/*
42. Routes SSE /stream

### Jour 17-20: UI
43. State management (stores + queries)
44. Hooks custom
45. Components shared/ui
46. Components features
47. Pages

---

**COMMENCE PAR shared/config/env.ts ET SUIS L'ORDRE CI-DESSUS** ✅