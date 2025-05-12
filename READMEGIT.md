
git init

# Flujo de Trabajo con Git

## 1. Flujo de Trabajo para Nuevos Cambios

```bash
# 1. Actualizar la rama principal
git checkout main
git pull origin main

# 2. Crear una nueva rama para el cambio
git checkout -b feature/nombre-del-cambio
# Ejemplos de nombres de ramas:
# - feature/nueva-funcionalidad
# - bugfix/correccion-error
# - enhancement/mejora-diseno
```

## 2. Convención para Nombres de Ramas
- `feature/`: Para nuevas funcionalidades
- `bugfix/`: Para corrección de errores
- `enhancement/`: Para mejoras
- `hotfix/`: Para correcciones urgentes
- `release/`: Para preparación de versiones

## 3. Flujo de Trabajo Diario
```bash
# 1. Hacer cambios en el código

# 2. Revisar los cambios
git status
git diff

# 3. Agregar los cambios
git add .

# 4. Crear un commit con mensaje descriptivo
git commit -m "tipo: descripción del cambio"
# Ejemplos de tipos:
# - feat: nueva funcionalidad
# - fix: corrección de error
# - docs: cambios en documentación
# - style: cambios de formato
# - refactor: refactorización de código
# - test: pruebas
# - chore: tareas de mantenimiento

# 5. Subir los cambios a GitHub
git push origin feature/nombre-del-cambio
```

## 4. Crear Pull Request
1. Ir a GitHub → Repositorio
2. Hacer clic en "Pull requests"
3. Hacer clic en "New pull request"
4. Seleccionar:
   - Base: `main`
   - Compare: tu rama de características

## 5. Estructura del Pull Request
```markdown
## Descripción
Breve descripción de los cambios realizados

## Cambios Realizados
- Lista de cambios específicos
- Detalles importantes
- Consideraciones técnicas

## Pruebas Realizadas
- Qué se probó
- Cómo se probó
- Resultados

## Capturas de Pantalla (si aplica)
[Agregar imágenes si hay cambios visuales]

## Checklist
- [ ] Código probado localmente
- [ ] Pruebas pasadas
- [ ] Documentación actualizada
- [ ] No hay conflictos
```

## 6. Después de Aprobar el PR
```bash
# 1. Actualizar rama principal local
git checkout main
git pull origin main

# 2. Eliminar rama de características
git branch -d feature/nombre-del-cambio

# 3. Eliminar rama remota (opcional)
git push origin --delete feature/nombre-del-cambio
```

## 7. Buenas Prácticas
1. **Commits**:
   - Hacer commits pequeños y frecuentes
   - Usar mensajes descriptivos
   - Seguir la convención de tipos

2. **Ramas**:
   - Mantener ramas actualizadas con main
   - No trabajar directamente en main
   - Eliminar ramas después de fusionar

3. **Pull Requests**:
   - Revisar cambios antes de crear PR
   - Probar cambios localmente
   - Mantener PRs pequeños y enfocados

4. **Código**:
   - Seguir estándares de código
   - Incluir comentarios cuando sea necesario
   - Mantener el código limpio y organizado

## 8. Cuándo Aplicar el Flujo Completo

1. **Flujo Completo (Nueva Característica)**:
- Al iniciar una nueva característica
- Al hacer cambios significativos
- Al modificar múltiples archivos
- Al cambiar la estructura del proyecto

2. **Flujo Simplificado (Cambios Menores)**:
- Correcciones de errores pequeños
- Cambios de estilo menores
- Actualizaciones de documentación
- En la misma rama de característica

3. **Al Finalizar una Sesión**:
- Siempre hacer commit de los cambios
- Push a la rama remota
- Documentar el estado actual
