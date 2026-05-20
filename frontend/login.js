console.log("LOGIN JS CARGADO");

async function login() {
  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;

  try {
    const res = await axios.post('http://192.168.100.3:3001/clientes/login', {
      usuario,
      password
    });

    const data = res.data;

    // guardar usuario
    localStorage.setItem("usuario", JSON.stringify(data));

    // redirección por rol
    if (data.rol === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "cliente.html";
    }

  } catch (error) {
    document.getElementById('error').innerText = "Credenciales incorrectas";
    console.error(error);
  }
}
