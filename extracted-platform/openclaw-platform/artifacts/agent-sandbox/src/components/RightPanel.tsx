import React, { useState } from "react"
import { useGetSession, useListTasks, useCreateTask } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Activity, Clock, Cpu, HardDrive, ListTree, Play, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export function RightPanel({ sessionId }: { sessionId: string }) {
  const { data: session } = useGetSession(sessionId);
  const { data: tasks, refetch: refetchTasks } = useListTasks(sessionId, { query: { refetchInterval: 3000 } });
  const { mutate: createTask, isPending: isCreatingTask } = useCreateTask();

  const [newTaskDesc, setNewTaskDesc] = useState("");

  const handleSpawnTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;
    
    createTask(
      { sessionId, data: { description: newTaskDesc, parallel: true } },
      {
        onSuccess: () => {
          setNewTaskDesc("");
          refetchTasks();
        }
      }
    );
  };

  if (!session) return null;

  return (
    <div className="w-80 bg-card border-l border-border h-full flex flex-col">
      {/* Session Metrics */}
      <div className="p-5 border-b border-white/5 space-y-4">
        <h3 className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
          <Activity className="w-4 h-4" /> Telemetry
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background border border-white/5 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground font-mono mb-1 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> MODEL
            </p>
            <p className="text-sm font-semibold truncate">{session.model}</p>
          </div>
          <div className="bg-background border border-white/5 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground font-mono mb-1 flex items-center gap-1">
              <HardDrive className="w-3 h-3" /> MEM_USAGE
            </p>
            <p className="text-sm font-semibold text-accent">{session.memoryUsage} MB</p>
          </div>
          <div className="bg-background border border-white/5 rounded-lg p-3 col-span-2">
            <p className="text-[10px] text-muted-foreground font-mono mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> UPTIME
            </p>
            <p className="text-sm font-semibold">
              {formatDistanceToNow(new Date(session.createdAt))}
            </p>
          </div>
        </div>
      </div>

      {/* Task Manager */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="p-5 pb-2">
          <h3 className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTree className="w-4 h-4" /> Task Pool
            </div>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px]">
              {tasks?.length || 0} TOTAL
            </span>
          </h3>
        </div>

        {/* Create Task Form */}
        <div className="px-5 py-3 border-b border-white/5 bg-black/20">
          <form onSubmit={handleSpawnTask} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Inject parallel task..." 
              className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-accent"
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
            />
            <Button type="submit" size="icon" variant="neon" className="w-8 h-8 rounded" disabled={isCreatingTask || !newTaskDesc}>
              <Play className="w-3 h-3" />
            </Button>
          </form>
        </div>

        {/* Task List */}
        <div className="p-3 space-y-2 flex-1 overflow-y-auto">
          {!tasks?.length && (
            <div className="text-center p-4 text-xs font-mono text-muted-foreground/50 border border-dashed border-white/10 rounded">
              No tasks dispatched
            </div>
          )}
          {tasks?.map(task => (
            <div key={task.id} className="bg-background border border-white/5 rounded-lg p-3 relative overflow-hidden group">
              {/* Status indicator line */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                task.status === 'completed' ? "bg-success" :
                task.status === 'failed' ? "bg-destructive" :
                task.status === 'running' ? "bg-primary animate-pulse" :
                "bg-warning"
              )} />
              
              <div className="pl-2">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium leading-tight line-clamp-2 pr-4">{task.description}</p>
                  {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                  {task.status === 'failed' && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                  {task.status === 'running' && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
                  {task.status === 'pending' && <Clock className="w-4 h-4 text-warning shrink-0" />}
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span className="bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[100px]" title={task.isolateId}>
                    {task.isolateId}
                  </span>
                  <span>{task.executionTimeMs ? `${task.executionTimeMs}ms` : '---'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
