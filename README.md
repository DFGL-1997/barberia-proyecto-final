# BarberIA — Proyecto Final de Redes 

![Docker](https://img.shields.io/badge/Docker-Swarm-2496ED?logo=docker)
![Apache Spark](https://img.shields.io/badge/Apache-Spark_3.5.8-E25A1C?logo=apachespark)
![HAProxy](https://img.shields.io/badge/HAProxy-Balanceador-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)
![Node.js](https://img.shields.io/badge/Node.js-Microservicios-339933?logo=nodedotjs)

**Universidad Autónoma de Occidente — Redes e Infraestructura — 2026**

**Integrantes:**
- Diego Fernando Gordillo Londoño
- Jhoan Sebastian Castellanos Mayor
- Juan Jose Jimenez Labrada

---

## 📋 Descripción del Proyecto

BarberIA es una aplicación web de gestión de barbería basada en arquitectura de microservicios, desplegada en un clúster Docker Swarm de dos nodos con balanceo de carga HAProxy y análisis de datos distribuido con Apache Spark 3.5.8.

El proyecto resuelve el problema del manejo manual de citas en barberías de la ciudad de Cali, eliminando la desorganización, doble asignación de citas, tiempos de espera prolongados y la falta de control sobre ingresos y disponibilidad de barberos.

---

## 🏗️ Arquitectura

### Clúster de Contenedores (Docker Swarm)

| Nodo | IP | Rol | Servicios |
|------|-----|-----|-----------|
| servidorUbuntu | 192.168.100.3 | Manager Leader | HAProxy, MS Usuarios, MS Servicios, MS Citas, MS Analytics, MySQL x3 |
| clienteUbuntu | 192.168.100.2 | Worker | Frontend Apache, Spark Worker |

### Microservicios

| Servicio | Imagen | Puerto | Función |
|----------|--------|--------|---------|
| barberia_usuarios | dfgl17/barberia-usuarios:v2 | 3001 | API REST gestión de usuarios y autenticación |
| barberia_servicios | dfgl17/barberia-servicios:latest | 3002 | API REST gestión de servicios |
| barberia_citas | dfgl17/barberia-citas:v4 | 3003 | API REST gestión de citas |
| barberia_analytics | dfgl17/barberia-analytics:latest | 3004 | API REST resultados Spark |
| barberia_frontend | dfgl17/barberia-frontend:v4 | 80 | Interfaz web HTML5/CSS3/JS |
| barberia_haproxy | dfgl17/barberia-haproxy:v2 | 8080/8404 | Balanceo de carga |
| barberia_mysql-clientes | mysql:8.0 | 3306 | BD exclusiva MS Usuarios |
| barberia_mysql-servicios | mysql:8.0 | 3307 | BD exclusiva MS Servicios |
| barberia_mysql-citas | mysql:8.0 | 3308 | BD exclusiva MS Citas |

### Clúster Apache Spark

| Nodo | Rol | Dirección |
|------|-----|-----------|
| servidorUbuntu | Spark Master | spark://192.168.100.3:7077 |
| clienteUbuntu | Spark Worker | 192.168.100.2 — 2 cores — 1 GB RAM |

---

## 🚀 Requisitos Previos

- [VirtualBox](https://www.virtualbox.org/)
- [Vagrant](https://www.vagrantup.com/)
- Windows con al menos 8GB de RAM disponibles

---

## ⚙️ Configuración de las VMs (Vagrantfile)

```ruby
Vagrant.configure("2") do |config|
  config.vbguest.auto_update = false
  config.vm.boot_timeout = 600

  config.vm.define :clienteUbuntu do |clienteUbuntu|
    clienteUbuntu.vm.box = "bento/ubuntu-22.04"
    clienteUbuntu.vm.network :private_network, ip: "192.168.100.2"
    clienteUbuntu.vm.hostname = "clienteUbuntu"
    clienteUbuntu.vm.provider "virtualbox" do |vb|
      vb.memory = "2048"
      vb.cpus = 2
    end
  end

  config.vm.define :servidorUbuntu do |servidorUbuntu|
    servidorUbuntu.vm.box = "bento/ubuntu-22.04"
    servidorUbuntu.vm.network :private_network, ip: "192.168.100.3"
    servidorUbuntu.vm.hostname = "servidorUbuntu"
    servidorUbuntu.vm.provider "virtualbox" do |vb|
      vb.memory = "6144"
      vb.cpus = 4
    end
  end
end
```

---

## 📦 Instalación y Despliegue

### PASO 1 — Levantar las VMs
```powershell
cd C:\Users\dfgl-\taller-docker
vagrant up
```

### PASO 2 — Conectarse (2 terminales)
```powershell
vagrant ssh servidorUbuntu
vagrant ssh clienteUbuntu
```

### PASO 3 — Corregir ruta (OBLIGATORIO en AMBAS VMs)
```bash
sudo ip route del 192.168.100.2 via 10.0.2.2 dev eth0 proto dhcp src 10.0.2.15 metric 100
```

### PASO 4 — Verificar el Swarm
```bash
docker node ls
```

Si clienteUbuntu aparece Down:
```bash
# Desde servidorUbuntu obtener token
docker swarm join-token worker

# Desde clienteUbuntu
docker swarm leave --force
docker swarm join --token <TOKEN> 192.168.100.3:2377 --advertise-addr 192.168.100.2
```

### PASO 5 — Desplegar el stack
```bash
cd /vagrant/barberia-docker
docker stack deploy -c docker-compose.yml barberia
```

### PASO 6 — Verificar servicios (esperar 2 minutos)
```bash
docker stack services barberia
# Todos deben mostrar 1/1
```

### PASO 7 — Configurar MySQL y cargar datos
```bash
# Permisos en los 3 contenedores MySQL
for svc in barberia_mysql-clientes barberia_mysql-servicios barberia_mysql-citas; do
  docker exec -it $(docker ps -q -f name=$svc) mysql -u root -pmysql -e \
    "CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'mysql'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'%'; FLUSH PRIVILEGES;"
done

# Cargar datos iniciales
docker exec -i $(docker ps -q -f name=barberia_mysql-clientes) mysql -u root -pmysql --default-character-set=utf8mb4 db_clientes < /vagrant/barberia-docker/mysql/init-clientes.sql
docker exec -i $(docker ps -q -f name=barberia_mysql-servicios) mysql -u root -pmysql --default-character-set=utf8mb4 db_servicios < /vagrant/barberia-docker/mysql/init-servicios.sql

# Cargar datos de prueba (30 barberos, 2000 clientes, 8000 citas)
grep "^INSERT.*servicios" /vagrant/barberia-docker/mysql/datos3.sql > /tmp/servicios_extra.sql
grep "^INSERT.*clientes" /vagrant/barberia-docker/mysql/datos3.sql > /tmp/clientes_data.sql
grep "^INSERT.*citas"    /vagrant/barberia-docker/mysql/datos3.sql > /tmp/citas_data.sql

docker exec -i $(docker ps -q -f name=barberia_mysql-servicios) mysql -u root -pmysql --default-character-set=utf8mb4 db_servicios < /tmp/servicios_extra.sql
docker exec -i $(docker ps -q -f name=barberia_mysql-clientes)  mysql -u root -pmysql --default-character-set=utf8mb4 db_clientes  < /tmp/clientes_data.sql
docker exec -i $(docker ps -q -f name=barberia_mysql-citas)     mysql -u root -pmysql --default-character-set=utf8mb4 db_citas     < /tmp/citas_data.sql
```

### PASO 8 — Iniciar clúster Spark

**En servidorUbuntu:**
```bash
export SPARK_HOME=/home/vagrant/spark-3.5.8-bin-hadoop3
$SPARK_HOME/bin/spark-class org.apache.spark.deploy.master.Master \
  --host 192.168.100.3 --port 7077 --webui-port 9090 > /tmp/spark-master.log 2>&1 &
```

**En clienteUbuntu:**
```bash
export SPARK_HOME=/home/vagrant/spark-3.5.8-bin-hadoop3
$SPARK_HOME/bin/spark-class org.apache.spark.deploy.worker.Worker \
  spark://192.168.100.3:7077 --host 192.168.100.2 --webui-port 9091 > /tmp/spark-worker.log 2>&1 &
```

### PASO 9 — Ejecutar análisis Spark
```bash
cd /vagrant/barberia-docker/spark
python3 exportar.py
export SPARK_HOME=/home/vagrant/spark-3.5.8-bin-hadoop3
$SPARK_HOME/bin/spark-submit --master spark://192.168.100.3:7077 analisis.py
```

---

## 🌐 URLs de Acceso

| Recurso | URL | Descripción |
|---------|-----|-------------|
| Frontend | http://192.168.100.3 | Login de la app |
| HAProxy Stats | http://192.168.100.3:8404/stats | Panel estadísticas |
| Spark UI | http://192.168.100.3:9090 | Clúster Spark |
| API Usuarios | http://192.168.100.3:3001/clientes | MS Usuarios directo |
| API Servicios | http://192.168.100.3:3002/servicios | MS Servicios directo |
| API Citas | http://192.168.100.3:3003/citas | MS Citas directo |
| API Analytics | http://192.168.100.3:3004/analytics | Resultados Spark |
| HAProxy API | http://192.168.100.3:8080/api/clientes | Via balanceador |

**Credenciales admin:** usuario `admin` / contraseña `admin123`

---

## 📊 Pruebas de Escalabilidad

```bash
# Escalar microservicios
docker service scale barberia_usuarios=3 barberia_servicios=3 barberia_citas=3

# Prueba sin balanceador (1 réplica)
ab -n 1000 -c 10 http://192.168.100.3:3001/clientes

# Prueba con HAProxy (3 réplicas)
ab -n 1000 -c 10 http://192.168.100.3:8080/api/clientes
```

### Resultados

| Escenario | Réplicas | Throughput | Tiempo medio | Errores |
|-----------|----------|------------|--------------|---------|
| Sin escalar | 1 | 15.3 req/seg | 318 ms | 0% |
| Con escalado | 3 | 19.5 req/seg | 247 ms | 0% |

**Mejora: 27% en throughput, 22% en tiempo de respuesta.**

---

## 🔧 Comandos Útiles

```bash
docker node ls                                          # Estado del swarm
docker stack services barberia                          # Estado de servicios
docker stack ps barberia --filter "desired-state=running"  # Contenedores activos
docker service logs barberia_usuarios --tail 20         # Logs de un servicio
docker service scale barberia_usuarios=3                # Escalar servicio
docker stack rm barberia                                # Bajar el stack
```

---

## 📁 Estructura del Proyecto

```
barberia-docker/
├── Clientes/          ← MS Usuarios (Node.js)
├── servicios/         ← MS Servicios (Node.js)
├── citas/             ← MS Citas (Node.js)
├── analytics/         ← MS Analytics (Node.js)
├── frontend/          ← Interfaz web (Apache)
├── haproxy/           ← Balanceador (haproxy.cfg)
├── mysql/             ← Scripts SQL init + datos
├── spark/             ← analisis.py, exportar.py
└── docker-compose.yml
```

---

## 🐳 Docker Hub

https://hub.docker.com/u/dfgl17

- `dfgl17/barberia-usuarios:v2`
- `dfgl17/barberia-servicios:latest`
- `dfgl17/barberia-citas:v4`
- `dfgl17/barberia-frontend:v4`
- `dfgl17/barberia-haproxy:v2`
- `dfgl17/barberia-analytics:latest`
