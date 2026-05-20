from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, sum, month, year, dayofweek, hour, desc
import json
import os

spark = SparkSession.builder \
    .appName("BarberIA Analytics") \
    .master("spark://192.168.100.3:7077") \
    .getOrCreate()

spark.sparkContext.setLogLevel("ERROR")

# Cargar CSV
df = spark.read.csv("/vagrant/barberia-docker/spark/citas_clean.csv", header=True, inferSchema=True)

print(f"Total registros: {df.count()}")

resultados = {}

# 1. Servicio mas solicitado
servicios = df.groupBy("servicio") \
    .agg(count("*").alias("total")) \
    .orderBy(desc("total")) \
    .limit(10)
resultados["servicios_populares"] = [row.asDict() for row in servicios.collect()]

# 2. Barbero con mas citas
barberos = df.filter(col("barbero").isNotNull()) \
    .groupBy("barbero") \
    .agg(count("*").alias("total")) \
    .orderBy(desc("total")) \
    .limit(10)
resultados["barberos_top"] = [row.asDict() for row in barberos.collect()]

# 3. Ingresos por mes
df_atendidas = df.filter(col("estado") == "atendida")
ingresos_mes = df_atendidas \
    .withColumn("mes", month(col("fecha_hora"))) \
    .withColumn("anio", year(col("fecha_hora"))) \
    .groupBy("anio", "mes") \
    .agg(sum("precio").alias("ingresos")) \
    .orderBy("anio", "mes")
resultados["ingresos_por_mes"] = [row.asDict() for row in ingresos_mes.collect()]

# 4. Metodo de pago mas usado
pagos = df.groupBy("metodo_pago") \
    .agg(count("*").alias("total")) \
    .orderBy(desc("total"))
resultados["metodos_pago"] = [row.asDict() for row in pagos.collect()]

# 5. Citas por estado
estados = df.groupBy("estado") \
    .agg(count("*").alias("total")) \
    .orderBy(desc("total"))
resultados["citas_por_estado"] = [row.asDict() for row in estados.collect()]

# 6. Hora pico
horas = df.withColumn("hora", hour(col("fecha_hora"))) \
    .groupBy("hora") \
    .agg(count("*").alias("total")) \
    .orderBy(desc("total")) \
    .limit(5)
resultados["horas_pico"] = [row.asDict() for row in horas.collect()]

# Guardar resultados
output_path = "/vagrant/barberia-docker/spark/resultados.json"
with open(output_path, "w") as f:
    json.dump(resultados, f, indent=2, default=str)

print(f"Resultados guardados en {output_path}")
spark.stop()
