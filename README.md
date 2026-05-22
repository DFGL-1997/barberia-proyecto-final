# BarberIA 💈

![Docker Swarm](https://img.shields.io/badge/Docker-Swarm-2496ED?logo=docker&logoColor=white)
![Apache Spark](https://img.shields.io/badge/Apache-Spark_3.5.8-E25A1C?logo=apachespark&logoColor=white)
![HAProxy](https://img.shields.io/badge/HAProxy-2.8-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=nodedotjs&logoColor=white)

> Sistema de gestión de barbería basado en arquitectura de microservicios desplegado en Docker Swarm con balanceo de carga HAProxy y análisis distribuido con Apache Spark 3.5.8.

**Universidad Autónoma de Occidente — Redes e Infraestructura — 2026**

**Integrantes:**
- Diego Fernando Gordillo Londoño
- Jhoan Sebastian Castellanos Mayor
- Juan Jose Jimenez Labrada

**Docente:** Oscar Mondragón

🔗 **Repositorio:** https://github.com/DFGL-1997/barberia-proyecto-final

---

## 📋 Descripción

BarberIA resuelve el problema del manejo manual de citas en barberías de la ciudad de Cali, eliminando la desorganización, doble asignación de turnos, tiempos de espera prolongados y falta de control sobre ingresos y disponibilidad de barberos.

El sistema integra:
- **4 microservicios Node.js** independientes con bases de datos MySQL dedicadas
- **Balanceo de carga HAProxy** con algoritmo Round-Robin
- **Clúster Apache Spark 3.5.8** para análisis distribuido de datos
- **Dashboard con 5 gráficas en tiempo real** generadas por Spark (servicios populares, barberos top, métodos de pago, estado de citas, ingresos mensuales)
- **Despliegue en Docker Swarm** sobre 2 nodos Ubuntu 22.04

---

## 🏗️ Arquitectura

```
Windows Host (Vagrant + VirtualBox) — 10 GB RAM, 8 núcleos
├── servidorUbuntu (192.168.100.3) — Manager Leader — 6 GB RAM, 4 CPUs
│   ├── HAProxy v2              :8080 (API) / :8404 (Stats)
│   ├── MS Usuarios             :3001  dfgl17/barberia-usuarios:v2
│   ├── MS Servicios            :3002  dfgl17/barberia-servicios:latest
│   ├── MS Citas                :3003  dfgl17/barberia-citas:v4
│   ├── MS Analytics            :3004  dfgl17/barberia-analytics:latest
│   ├── MySQL Clientes          :3306  (db_clientes)
│   ├── MySQL Servicios         :3307  (db_servicios)
│   ├── MySQL Citas             :3308  (db_citas)
│   └── Spark Master            :7077 / WebUI :9090
└── clienteUbuntu (192.168.100.2) — Worker Node — 2 GB RAM, 2 CPUs
    ├── Frontend Apache         :80    dfgl17/barberia-frontend:v5
    └── Spark Worker            WebUI :9091 (2 cores, 1 GB RAM)
```

---

## 📊 Dataset

| Atributo | Detalle |
|----------|---------|
| Archivo | `citas_clean.csv` |
| Registros | 8.001 citas |
| Período | Enero 2023 – Diciembre 2024 |
| Usuarios | 2.031 (30 barberos + 2.000 clientes) |
| Servicios | 30 servicios ($8.000 – $80.000 COP) |
| Análisis Spark | 6 análisis distribuidos |

**Resultados Analytics:**
- 🏆 Servicio top: Corte básico (541 citas)
- 👑 Barbero top: Tomas Clipper (297 citas)
- 💳 Pago favorito: Tarjeta (1.673 usos)
- 💰 Ingresos promedio: ~$6.000.000 COP/mes

---

## 🚀 Requisitos Previos

- [VirtualBox 7.0+](https://www.virtualbox.org/)
- [Vagrant 2.4+](https://www.vagrantup.com/)
- Windows 10/11 con al menos 10 GB RAM disponibles

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

### PASO 3 — Corregir ruta de red (OBLIGATORIO en AMBAS VMs)
```bash
# En servidorUbuntu
sudo ip route del 192.168.100.3 via 10.0.2.2 dev eth0 proto dhcp src 10.0.2.15 metric 100

# En clienteUbuntu
sudo ip route del 192.168.100.2 via 10.0.2.2 dev eth0 proto dhcp src 10.0.2.15 metric 100
```

### PASO 4 — Verificar el Swarm
```bash
docker node ls
# Ambos nodos deben aparecer en estado Ready
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

### PASO 7 — Cargar datos iniciales
```bash
# Permisos en los 3 contenedores MySQL
for svc in barberia_mysql-clientes barberia_mysql-servicios barberia_mysql-citas; do
  docker exec -it $(docker ps -q -f name=$svc) mysql -u root -pmysql -e \
    "CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'mysql'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'%'; FLUSH PRIVILEGES;"
done

# Cargar esquemas
docker exec -i $(docker ps -q -f name=barberia_mysql-clientes) mysql -u root -pmysql --default-character-set=utf8mb4 db_clientes < /vagrant/barberia-docker/mysql/init-clientes.sql
docker exec -i $(docker ps -q -f name=barberia_mysql-servicios) mysql -u root -pmysql --default-character-set=utf8mb4 db_servicios < /vagrant/barberia-docker/mysql/init-servicios.sql

# Cargar datos de prueba (30 barberos, 2.000 clientes, 8.001 citas)
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

## 📊 Pruebas de Desempeño — JMeter 5.6.3

| Escenario | Usuarios | Réplicas | Throughput | Prom. (ms) | Error % |
|-----------|----------|----------|------------|------------|---------|
| Baseline (sin HAProxy) | 10 | 1 | 12.4/seg | 766 | 0.20% |
| HAProxy 1 réplica | 10 | 1 | 11.4/seg | 774 | 0.00% |
| HAProxy 3 réplicas | 10 | 3 | 7.6/seg | 1.141 | 0.00% |
| Stress Test | 100 | 1 | 6.2/seg | 15.553 | 0.36% |
| Lunes Tranquilo | 10 | 1 | 1.5/seg | 8.991 | 0.00% |
| Sábado a Tope | 80 | 3 | 4.8/seg | 15.045 | 9.28% |

**Hallazgos:**
- HAProxy redujo el tiempo de respuesta máximo en **71.3%** (21.034 → 6.043 ms)
- Escalado horizontal incrementó el throughput en **+220%** bajo alta concurrencia
- Límite operativo: **~15 usuarios concurrentes por réplica**

---

## 🔧 Comandos Útiles

```bash
# Estado del clúster
docker node ls
docker stack services barberia

# Escalar microservicios (para pruebas de carga)
docker service scale barberia_usuarios=3 barberia_servicios=3 barberia_citas=3

# Volver a 1 réplica (uso normal)
docker service scale barberia_usuarios=1 barberia_servicios=1 barberia_citas=1

# Ver recursos en tiempo real
docker stats $(docker ps --filter name=barberia_usuarios -q)

# Logs de un servicio
docker service logs barberia_usuarios --tail 20

# Reiniciar un servicio
docker service update --force barberia_usuarios

# Bajar el stack
docker stack rm barberia
```

---

## 📁 Estructura del Proyecto

```
barberia-docker/
├── Clientes/          ← MS Usuarios (Node.js)
├── servicios/         ← MS Servicios (Node.js)
├── citas/             ← MS Citas (Node.js)
├── analytics/         ← MS Analytics (Node.js)
├── frontend/          ← Interfaz web (Apache) con gráficas Chart.js
├── haproxy/           ← Balanceador (haproxy.cfg)
├── mysql/             ← Scripts SQL init + datos
├── spark/             ← analisis.py, exportar.py
└── docker-compose.yml
```

---

## 🐳 Imágenes Docker Hub

| Servicio | Imagen |
|----------|--------|
| MS Usuarios | `dfgl17/barberia-usuarios:v2` |
| MS Servicios | `dfgl17/barberia-servicios:latest` |
| MS Citas | `dfgl17/barberia-citas:v4` |
| MS Analytics | `dfgl17/barberia-analytics:latest` |
| Frontend | `dfgl17/barberia-frontend:v5` |
| HAProxy | `dfgl17/barberia-haproxy:v2` |

🔗 https://hub.docker.com/u/dfgl17

---

## 📄 Licencia

MIT License — Universidad Autónoma de Occidente 2026
