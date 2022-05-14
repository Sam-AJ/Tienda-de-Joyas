const express = require('express')
const joyas = require('./data/joyas.js')
const app = express()

app.listen(3000, () => console.log('Servidor funcionando en puerto 3000'))

const HATEOASV1 = () => {
  return joyas.results.map(joya => {
    return {
      name: joya.name,
      url: `http://localhost:3000/joyas/${joya.id}`
    }
  });
};

const HATEOASV2 = () => {
  return joyas.results.map(joya => {
    return {
      nombre: joya.name,
      src: `http://localhost:3000/api/v2/joyas/${joya.id}`
    }
  });
};

const joya = (id) => {
  return joyas.results.find(j => j.id == id);
};

const filterByCategory = (category) => {
  return joyas.results.filter(joya => joya.category === category)
};

// Permitir hacer ordenamiento de las joyas según su valor de forma ascendente o descendente usando Query Strings.
const orderValues = (order) => {
  if (order == 'asc') {
    return joyas.results.sort((a, b) => a.value > b.value ? 1 : -1)
  } else if (order == 'desc') {
    return joyas.results.sort((a, b) => a.value < b.value ? 1 : -1)
  }
};

const fieldsSelect = (joya, fields) => {
  fields = fields.split(",");
  let retorno = {};
  for (const key in joya) {
    if (fields.includes(key)) {
      retorno[key] = joya[key]
    }
  }
  return retorno
};

// Crear una ruta para la devolución de todas las joyas aplicando HATEOAS.
app.get('/api/v1/joyas', (req, res) => {
  res.send(HATEOASV1());
});

// Hacer una segunda versión de la API que ofrezca los mismos datos pero con los nombres de las propiedades diferentes.
app.get('/api/v2/joyas', (req, res) => {
  if (req.query.value) {
    return res.send(orderValues(req.query.value))
  }

// Permitir hacer paginación de las joyas usando Query Strings.
  if(req.query.page){
    const page = req.query.page;
    return res.send(HATEOASV2().slice((page * 2 - 2), page * 2));
  }
  res.send(HATEOASV2());
});

// La API REST debe poder ofrecer una ruta con la que se puedan filtrar las joyas por categoría.
app.get('/api/v2/joyas/category/:categoria', (req, res) => {
  const categoria = req.params.categoria;
  res.send({
    cantidad: filterByCategory(categoria).length,
    joyas: filterByCategory(categoria)
  });
});

// Crear una ruta que permita el filtrado por campos de una joya a consultar.
// Crear una ruta que devuelva como payload un JSON con un mensaje de error cuando el usuario consulte el id de una joya que no exista.
app.get("/api/v2/joyas/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.query.fields;
  if (!joya(id)) {
    return res.status(404).send({
      code: '404 Recurso no encontrado',
      message: 'No existe una joya con este id'
    })
  }

  if (!fields) {
    res.send(joya(id));
  } else {
    res.send(fieldsSelect(joya(id), fields));
  }
});