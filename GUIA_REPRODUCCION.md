# 🚀 GUÍA DE REPRODUCCIÓN - BarberIA

**Última actualización:** Mayo 2026  
**Versión del Proyecto:** 1.0.0  
**Autor:** Diego Fernando Gordillo Londoño, Jhoan Sebastian Castellanos Mayor, Juan Jose Jimenez Labrada

---

## 📋 **TABLA DE CONTENIDOS**

1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Descargar el Proyecto](#paso-1-descargar-el-proyecto)
3. [Paso 2: Configurar Máquinas Virtuales](#paso-2-configurar-máquinas-virtuales)
4. [Paso 3: Iniciar Docker Swarm](#paso-3-iniciar-docker-swarm)
5. [Paso 4: Desplegar la Aplicación](#paso-4-desplegar-la-aplicación)
6. [Paso 5: Configurar Base de Datos](#paso-5-configurar-base-de-datos)
7. [Paso 6: Iniciar Clúster Spark](#paso-6-iniciar-clúster-spark)
8. [Paso 7: Verificar que Funcione](#paso-7-verificar-que-funcione)
9. [URLs de Acceso](#urls-de-acceso)
10. [Solución de Problemas](#solución-de-problemas)

---

## ✅ **REQUISITOS PREVIOS**

### **Hardware Mínimo**
- **CPU:** 4 núcleos (recomendado 8+)
- **RAM:** 8GB (mínimo), 16GB (recomendado)
- **Almacenamiento:** 50GB libres
- **Sistema Operativo:** Windows 10/11 con capacidad de virtualización

### **Software Requerido**

| Software | Versión | Link de Descarga |
|----------|---------|------------------|
| VirtualBox | 7.0+ | https://www.virtualbox.org/wiki/Downloads |
| Vagrant | 2.4+ | https://www.vagrantup.com/downloads |
| Git | 2.40+ | https://git-scm.com/download/win |
| JMeter (opcional) | 5.6+ | https://jmeter.apache.org/ |

---

## 📥 **PASO 1: DESCARGAR EL PROYECTO**

### **Opción A: Con Git (Recomendado)**

```powershell
# Abre PowerShell y ejecuta:
cd C:\tu\carpeta\de\trabajo

git clone https://github.com/DFGL-1997/barberia-proyecto-final.git

cd barberia-proyecto-final

# Verifica que descargó todo
dir
```

Deberías ver:
```
Clientes/
servicios/
citas/
analytics/
frontend/
haproxy/
mysql/
spark/
docker-compose.yml
.env
README.md
...
```

### **Opción B: Descargar ZIP**

1. Ve a: https://github.com/DFGL-1997/barberia-proyecto-final
2. Click en **Code** → **Download ZIP**
3. Extrae en `C:\taller-docker` (o donde prefieras)
4. Abre PowerShell en esa carpeta

---

## 🖥️ **PASO 2: CONFIGURAR MÁQUINAS VIRTUALES**

### **2.1: Copiar Vagrant Configuration**

El proyecto incluye un `Vagrantfile` (si no está en la raíz, créalo):

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

### **2.2: Levantar las VMs**

```powershell
# En la carpeta del proyecto
vagrant up

# Esto puede tomar 5-10 minutos en primera ejecución
# Espera a que termine sin errores
```

### **2.3: Conectarse a las VMs**

Abre **2 PowerShells** diferentes:

**Terminal 1 (Manager):**
```powershell
vagrant ssh servidorUbuntu
```

**Terminal 2 (Worker):**
```powershell
vagrant ssh clienteUbuntu
```

---

## 🐳 **PASO 3: INICIAR DOCKER SWARM**

**Solo en servidorUbuntu (Terminal 1):**

```bash
# Inicializar Swarm
docker swarm init --advertise-addr 192.168.100.3

# Obtener token para el worker
docker swarm join-token worker
```

Verás algo como:
```
To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-xxx 192.168.100.3:2377
```

**En clienteUbuntu (Terminal 2):**

```bash
# Ejecuta el comando que te dio servidorUbuntu
docker swarm join --token SWMTKN-1-xxx 192.168.100.3:2377 --advertise-addr 192.168.100.2
```

**Verifica el estado (en servidorUbuntu):**

```bash
docker node ls
```

Deberías ver:
```
ID                            HOSTNAME         STATUS    AVAILABILITY   MANAGER STATUS
xxx *                         servidorUbuntu   Ready     Active         Leader
yyy                           clienteUbuntu    Ready     Active
```

---

## 🔧 **PASO 4: DESPLEGAR LA APLICACIÓN**

**Solo en servidorUbuntu:**

```bash
# Ve a la carpeta compartida
cd /vagrant/barberia-docker

# Verifica que exista docker-compose.yml
ls -la docker-compose.yml

# Desplega el stack
docker stack deploy -c docker-compose.yml barberia

# Espera 2 minutos y verifica
docker stack services barberia
```

Todos los servicios deben mostrar `1/1` en REPLICAS:

```
ID            NAME                          MODE        REPLICAS   IMAGE
xxx           barberia_analytics            replicated  1/1        dfgl17/barberia-analytics:v2.0.0
xxx           barberia_citas                replicated  1/1        dfgl17/barberia-citas:v4.0.0
xxx           barberia_frontend             replicated  1/1        dfgl17/barberia-frontend:v4.0.0
xxx           barberia_haproxy              replicated  1/1        dfgl17/barberia-haproxy:v2.0.0
xxx           barberia_mysql-citas          replicated  1/1        mysql:8.0
xxx           barberia_mysql-clientes       replicated  1/1        mysql:8.0
xxx           barberia_mysql-servicios      replicated  1/1        mysql:8.0
xxx           barberia_servicios            replicated  1/1        dfgl17/barberia-servicios:v2.0.0
xxx           barberia_usuarios             replicated  1/1        dfgl17/barberia-usuarios:v2.0.0
```

---

## 💾 **PASO 5: CONFIGURAR BASE DE DATOS**

**En servidorUbuntu:**

```bash
# Dar permisos a root en los 3 contenedores MySQL
for svc in barberia_mysql-clientes barberia_mysql-servicios barberia_mysql-citas; do
  docker exec -it $(docker ps -q -f name=$svc) mysql -u root -pmysql -e \
    "CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'mysql'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'%'; FLUSH PRIVILEGES;"
done

# Espera 10 segundos
sleep 10

# Cargar datos iniciales
docker exec -i $(docker ps -q -f name=barberia_mysql-clientes) mysql -u root -pmysql --default-character-set=utf8mb4 db_clientes < /vagrant/barberia-docker/mysql/init-clientes.sql

docker exec -i $(docker ps -q -f name=barberia_mysql-servicios) mysql -u root -pmysql --default-character-set=utf8mb4 db_servicios < /vagrant/barberia-docker/mysql/init-servicios.sql

docker exec -i $(docker ps -q -f name=barberia_mysql-citas) mysql -u root -pmysql --default-character-set=utf8mb4 db_citas < /vagrant/barberia-docker/mysql/init-citas.sql

# Cargar datos de prueba (8000+ citas)
grep "^INSERT.*servicios" /vagrant/barberia-docker/mysql/datos3.sql > /tmp/servicios_extra.sql
grep "^INSERT.*clientes" /vagrant/barberia-docker/mysql/datos3.sql > /tmp/clientes_data.sql
grep "^INSERT.*citas"    /vagrant/barberia-docker/mysql/datos3.sql > /tmp/citas_data.sql

docker exec -i $(docker ps -q -f name=barberia_mysql-servicios) mysql -u root -pmysql --default-character-set=utf8mb4 db_servicios < /tmp/servicios_extra.sql

docker exec -i $(docker ps -q -f name=barberia_mysql-clientes) mysql -u root -pmysql --default-character-set=utf8mb4 db_clientes < /tmp/clientes_data.sql

docker exec -i $(docker ps -q -f name=barberia_mysql-citas) mysql -u root -pmysql --default-character-set=utf8mb4 db_citas < /tmp/citas_data.sql

echo "✅ Base de datos configurada"
```

---

## ⚡ **PASO 6: INICIAR CLÚSTER SPARK**

### **6.1: En servidorUbuntu (Terminal 1)**

```bash
export SPARK_HOME=/home/vagrant/spark-3.5.8-bin-hadoop3

$SPARK_HOME/bin/spark-class org.apache.spark.deploy.master.Master \
  --host 192.168.100.3 --port 7077 --webui-port 9090 > /tmp/spark-master.log 2>&1 &

# Verifica que esté corriendo
sleep 2
curl http://localhost:9090
```

### **6.2: En clienteUbuntu (Terminal 2)**

```bash
export SPARK_HOME=/home/vagrant/spark-3.5.8-bin-hadoop3

$SPARK_HOME/bin/spark-class org.apache.spark.deploy.worker.Worker \
  spark://192.168.100.3:7077 --host 192.168.100.2 --webui-port 9091 > /tmp/spark-worker.log 2>&1 &

# Verifica
sleep 2
curl http://192.168.100.3:9090
```

### **6.3: Ejecutar Análisis Spark (en servidorUbuntu)**

```bash
cd /vagrant/barberia-docker/spark

# Primero exportar datos de MySQL
python3 exportar.py

# Luego ejecutar análisis
export SPARK_HOME=/home/vagrant/spark-3.5.8-bin-hadoop3

$SPARK_HOME/bin/spark-submit --master spark://192.168.100.3:7077 analisis.py

# Ver resultados
cat resultados.json
```

---

## ✅ **PASO 7: VERIFICAR QUE FUNCIONE**

**Desde tu computadora Windows:**

```powershell
# Prueba cada endpoint

# 1. Frontend
Start-Process "http://192.168.100.3"

# 2. APIs directas
Invoke-WebRequest -Uri "http://192.168.100.3:3001/clientes" -Method GET

# 3. HAProxy (balanceador)
Invoke-WebRequest -Uri "http://192.168.100.3:8080/api/clientes" -Method GET

# 4. HAProxy Stats
Start-Process "http://192.168.100.3:8404/stats"

# 5. Spark UI
Start-Process "http://192.168.100.3:9090"
```

---

## 🌐 **URLS DE ACCESO**

| Servicio | URL | Usuario | Contraseña |
|----------|-----|---------|-----------|
| **Frontend** | http://192.168.100.3 | admin | admin123 |
| **API Usuarios (Directo)** | http://192.168.100.3:3001/clientes | - | - |
| **API Servicios (Directo)** | http://192.168.100.3:3002/servicios | - | - |
| **API Citas (Directo)** | http://192.168.100.3:3003/citas | - | - |
| **API Analytics** | http://192.168.100.3:3004/analytics | - | - |
| **HAProxy (Balanceador)** | http://192.168.100.3:8080/api/clientes | - | - |
| **HAProxy Stats** | http://192.168.100.3:8404/stats | - | - |
| **Spark Master UI** | http://192.168.100.3:9090 | - | - |
| **Spark Worker UI** | http://192.168.100.3:9091 | - | - |

---

## 🔧 **COMANDOS ÚTILES**

```bash
# Ver estado del Swarm
docker node ls
docker stack services barberia

# Ver logs de un servicio
docker service logs barberia_usuarios --tail 50

# Escalar un servicio
docker service scale barberia_usuarios=3

# Detener todo
docker stack rm barberia

# Ver estadísticas de contenedores
docker stats

# Ejecutar SQL en MySQL
docker exec -it $(docker ps -q -f name=barberia_mysql-clientes) mysql -u root -pmysql db_clientes
```

---

## ❌ **SOLUCIÓN DE PROBLEMAS**

### **Problema: VMs no inician**

```powershell
# Elimina VMs anteriores
vagrant destroy -f

# Intenta de nuevo
vagrant up
```

### **Problema: clienteUbuntu aparece "Down" en docker node ls**

```bash
# En servidorUbuntu, obtén el token
docker swarm join-token worker

# En clienteUbuntu
docker swarm leave --force
docker swarm join --token <TOKEN> 192.168.100.3:2377 --advertise-addr 192.168.100.2
```

### **Problema: Servicios no están 1/1**

```bash
# Espera 2 minutos más
sleep 120
docker stack services barberia

# Si aún hay problemas, ver logs
docker stack ps barberia
docker service logs barberia_usuarios
```

### **Problema: MySQL no conecta**

```bash
# Verifica que MySQL esté corriendo
docker ps | grep mysql

# Intenta conectar directamente
docker exec -it $(docker ps -q -f name=barberia_mysql-clientes) mysql -u root -pmysql

# Si falla, reinicia los contenedores
docker service update --force barberia_mysql-clientes
```

### **Problema: Spark no inicia**

```bash
# Verifica que Spark esté instalado
ls -la /home/vagrant/spark-3.5.8-bin-hadoop3

# Ver logs
tail -f /tmp/spark-master.log
tail -f /tmp/spark-worker.log
```

### **Problema: No puedo acceder desde Windows**

```powershell
# Verifica que puedas hacer ping
ping 192.168.100.3

# Si no funciona, revisa firewall de Windows
# Settings → Privacy & Security → Windows Defender Firewall
# → Allow an app through firewall → Allow VirtualBox
```

---

## 📊 **PRUEBAS DE DESEMPEÑO (OPCIONAL)**

Ver: [GUÍA DE PRUEBAS CON JMETER](./TESTING.md)

---

## 📞 **SOPORTE**

Si tienes problemas:
1. Revisa esta guía nuevamente
2. Revisa los logs: `docker service logs barberia_usuarios`
3. Consulta el README.md principal
4. Abre un issue en GitHub

---

**¡Éxito!** 🚀
