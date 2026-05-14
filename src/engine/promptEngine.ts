export interface PromptSegment {
  partTitle: string
  action: string
  prompt: string
  transition?: string
}

export interface PromptVersion {
  title: string
  content: string
  style: string
  segments?: PromptSegment[]
}

export interface OptimizeResult {
  theme: string
  duration: string
  ratio: string
  sceneType: string
  versions: PromptVersion[]
  tips: string[]
}

export interface StoryboardFrameInput {
  title: string
  prompt: string
}

export interface StoryboardFrameResult extends StoryboardFrameInput {
  imageUrl: string
}

export interface GeneratedImageResult {
  prompt: string
  imageUrl: string
  revisedPrompt?: string
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed.'

    try {
      const payload = await response.json()
      message = payload?.message || message
    } catch {
      message = await response.text()
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function optimizePrompt(
  input: string,
  sceneType: string,
  duration: string,
  ratio: string,
  customSeconds?: number,
  images?: string[]
): Promise<OptimizeResult> {
  return readJson<OptimizeResult>(
    await fetch('/api/prompt/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input,
        sceneType,
        duration,
        ratio,
        customSeconds,
        images
      })
    })
  )
}

export async function generateStoryboardFrame(frame: StoryboardFrameInput): Promise<StoryboardFrameResult> {
  return readJson<StoryboardFrameResult>(
    await fetch('/api/image/storyboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(frame)
    })
  )
}

export async function generatePromptImage(input: string, ratio: string): Promise<GeneratedImageResult> {
  return readJson<GeneratedImageResult>(
    await fetch('/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input,
        ratio
      })
    })
  )
}
