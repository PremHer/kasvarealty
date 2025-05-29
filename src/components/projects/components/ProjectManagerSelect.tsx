import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface ProjectManager {
  id: string
  name: string
  email: string
}

interface ProjectManagerSelectProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (manager: ProjectManager) => void
}

export default function ProjectManagerSelect({
  open,
  onOpenChange,
  onSelect
}: ProjectManagerSelectProps) {
  const [managers, setManagers] = useState<ProjectManager[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await fetch('/api/users/project-managers')
        if (!response.ok) throw new Error('Error al cargar project managers')
        const data = await response.json()
        setManagers(data.map((manager: any) => ({
          id: manager.id,
          name: manager.nombre,
          email: manager.email
        })))
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchManagers()
    }
  }, [open])

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Project Manager</DialogTitle>
          <DialogDescription>
            Elija un Project Manager para asignar al proyecto
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar project manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : filteredManagers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">No se encontraron project managers</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredManagers.map((manager) => (
                <Button
                  key={manager.id}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => onSelect(manager)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {manager.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{manager.name}</span>
                    <span className="text-xs text-muted-foreground">{manager.email}</span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 