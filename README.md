# 🧔 BarberIA — Despliegue con Docker

## Arquitectura

```
servidorUbuntu (192.168.100.3) — Swarm Manager
├── contenedor: mysql      → puerto 3306
├── contenedor: clientes   → puerto 3001
├── contenedor: servicios  → puerto 3002
├── contenedor: citas      → puerto 3003
└── contenedor: frontend   → puerto 80

clienteUbuntu (192.168.100.2) — Swarm Worker
└── (recibe servicios replicados del swarm)
```

## Componentes

| Servicio | Imagen | Puerto | Descripción |
|---|---|---|---|
| mysql | mysql:8.0 | 3306 | Base de datos |
| clientes | dfgl17/barberia-clientes | 3001 | Microservicio clientes |
| servicios | dfgl17/barberia-servicios | 3002 | Microservicio servicios |
| citas | dfgl17/barberia-citas | 3003 | Microservicio citas |
| frontend | dfgl17/barberia-frontend | 80 | Interfaz web Apache |

## Pasos de despliegue

### 1. Copiar proyecto a la carpeta compartida
Copia la carpeta `barberia-docker` a `C:\Users\dfgl-\taller-docker\`

### 2. En servidorUbuntu (192.168.100.3)

```bash
# Iniciar Swarm
docker swarm init --advertise-addr 192.168.100.3

# Guardar el token que aparece para unir el worker
# Se verá algo como: docker swarm join --token SWMTKN-... 192.168.100.3:2377
```

### 3. En clienteUbuntu (192.168.100.2)

```bash
# Unirse al swarm con el token del paso anterior
docker swarm join --token SWMTKN-xxxx 192.168.100.3:2377
```

### 4. En servidorUbuntu — Build y Push de imágenes

```bash
cd /vagrant/barberia-docker

docker login -u dfgl17

docker build -t dfgl17/barberia-clientes:latest ./Clientes
docker build -t dfgl17/barberia-servicios:latest ./servicios
docker build -t dfgl17/barberia-citas:latest ./citas
docker build -t dfgl17/barberia-frontend:latest ./frontend

docker push dfgl17/barberia-clientes:latest
docker push dfgl17/barberia-servicios:latest
docker push dfgl17/barberia-citas:latest
docker push dfgl17/barberia-frontend:latest
```

### 5. En servidorUbuntu — Desplegar el stack

```bash
cd /vagrant/barberia-docker
docker stack deploy -c docker-compose.yml barberia
```

### 6. Verificar que todo corre

```bash
docker stack services barberia
docker service ls
docker ps
```

### 7. Acceder a la app

- Frontend: http://192.168.100.3
- API Clientes: http://192.168.100.3:3001/clientes
- API Servicios: http://192.168.100.3:3002/servicios
- API Citas: http://192.168.100.3:3003/citas

## Comandos útiles

```bash
# Ver logs de un servicio
docker service logs barberia_clientes

# Escalar un servicio (para pruebas JMeter)
docker service scale barberia_clientes=3

# Eliminar el stack
docker stack rm barberia

# Ver nodos del swarm
docker node ls
```

## Cambios en el código para Docker

| Archivo | Cambio |
|---|---|
| `*/models/*.js` | `host: 'localhost'` → `host: 'mysql'` (nombre del servicio) |
| `citas/models/citasModel.js` | `localhost:3001/3002` → `clientes:3001` / `servicios:3002` |
| `frontend/*.html` y `login.js` | `localhost:3001/3002/3003` → `192.168.100.3:3001/3002/3003` |
