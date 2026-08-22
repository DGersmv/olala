export type SiteLoadTask = {
  id: string
  label: string
  weight: number
  progress: number
}

export type SiteLoadSnapshot = {
  totalProgress: number
  tasks: SiteLoadTask[]
  activeLabel: string
}

type Listener = (snapshot: SiteLoadSnapshot) => void

export class SiteLoadTracker {
  private tasks = new Map<string, SiteLoadTask>()
  private listeners = new Set<Listener>()

  register(id: string, label: string, weight: number) {
    if (this.tasks.has(id)) return
    this.tasks.set(id, { id, label, weight, progress: 0 })
    this.emit()
  }

  setProgress(id: string, progress: number) {
    const task = this.tasks.get(id)
    if (!task) return
    task.progress = Math.min(1, Math.max(0, progress))
    this.emit()
  }

  complete(id: string) {
    this.setProgress(id, 1)
  }

  getSnapshot(): SiteLoadSnapshot {
    const tasks = [...this.tasks.values()]
    let weighted = 0
    let totalWeight = 0
    for (const task of tasks) {
      weighted += task.progress * task.weight
      totalWeight += task.weight
    }
    const totalProgress = totalWeight > 0 ? weighted / totalWeight : 0
    const active =
      tasks.find((task) => task.progress < 1)?.label ??
      tasks[tasks.length - 1]?.label ??
      "Готово"
    return { totalProgress, tasks, activeLabel: active }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit() {
    const snapshot = this.getSnapshot()
    for (const listener of this.listeners) listener(snapshot)
  }
}
