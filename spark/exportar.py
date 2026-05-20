import subprocess
import csv

def exportar_tabla(container_filter, query):
    container_id = subprocess.check_output(
        ['docker', 'ps', '-q', '-f', f'name={container_filter}']
    ).decode().strip()
    
    result = subprocess.run([
        'docker', 'exec', container_id,
        'mysql', '-u', 'root', '-pmysql', '--batch', '--default-character-set=utf8mb4', '-e', query
    ], capture_output=True, text=True, encoding='utf-8', errors='replace')
    
    lines = [l for l in result.stdout.split('\n') 
             if l and 'Warning' not in l and 'mysql:' not in l and 'password' not in l]
    return lines

# Exportar citas con JOIN entre los 3 contenedores MySQL
query = """
SELECT c.id, c.cliente_id, c.servicio_id, c.barbero_id, c.fecha_hora, c.precio, c.estado, c.metodo_pago
FROM db_citas.citas c
"""

lines_citas = exportar_tabla('barberia_mysql-citas', query)

# Exportar clientes
query_clientes = "SELECT id, nombre FROM db_clientes.clientes"
lines_clientes = exportar_tabla('barberia_mysql-clientes', query_clientes)

# Exportar servicios
query_servicios = "SELECT id, nombre FROM db_servicios.servicios"
lines_servicios = exportar_tabla('barberia_mysql-servicios', query_servicios)

# Crear diccionarios de lookup
clientes_dict = {}
for line in lines_clientes[1:]:
    if line:
        parts = line.split('\t')
        if len(parts) >= 2:
            clientes_dict[parts[0]] = parts[1]

servicios_dict = {}
for line in lines_servicios[1:]:
    if line:
        parts = line.split('\t')
        if len(parts) >= 2:
            servicios_dict[parts[0]] = parts[1]

# Generar CSV combinado
with open('/vagrant/barberia-docker/spark/citas_clean.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['id','cliente_id','servicio_id','barbero_id','fecha_hora','precio','estado','metodo_pago','cliente','servicio','barbero'])
    
    for line in lines_citas[1:]:
        if not line:
            continue
        parts = line.split('\t')
        if len(parts) >= 8:
            cliente_id = parts[1]
            servicio_id = parts[2]
            barbero_id = parts[3]
            cliente = clientes_dict.get(cliente_id, 'Desconocido')
            servicio = servicios_dict.get(servicio_id, 'Desconocido')
            barbero = clientes_dict.get(barbero_id, 'Sin preferencia')
            writer.writerow(parts + [cliente, servicio, barbero])

print(f"CSV generado con {len(lines_citas)-1} registros")
