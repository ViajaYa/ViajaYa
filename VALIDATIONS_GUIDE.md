# 📋 Guía de Validaciones Colombianas

## 🚀 Instalación y Uso

El archivo `src/utils/validations.js` contiene todas las validaciones específicas para datos colombianos.

### Importación

```javascript
import { 
  validatePhoneNumber, 
  validateEmail, 
  validateName, 
  validateDocument, 
  validateAge,
  getDocumentTypes,
  formatPhoneNumber,
  formatDocumentNumber,
  validateForm
} from '../utils/validations';
```

## 📱 Validación de Teléfonos

### Formatos Soportados:
- **Celulares:** 3001234567, 3XX XXX XXXX
- **Fijos Bogotá:** 6011234567, (601) 123 4567
- **Fijos otras ciudades:** 60X XXX XXXX
- **Con código país:** +57 300 123 4567, 57 300 123 4567

### Uso:
```javascript
const validation = validatePhoneNumber("3001234567");
if (validation.isValid) {
  console.log("Teléfono válido:", validation.formatted);
  console.log("Tipo:", validation.type); // 'mobile' o 'landline'
} else {
  console.log("Error:", validation.message);
}
```

## 🆔 Validación de Documentos

### Tipos Soportados:
- **CC:** Cédula de Ciudadanía (6-10 dígitos)
- **TI:** Tarjeta de Identidad (10-11 dígitos)
- **CE:** Cédula de Extranjería (6-10 dígitos)
- **PA:** Pasaporte (6-12 caracteres, letras y números)
- **RC:** Registro Civil (10-11 dígitos)
- **MS:** Menor sin identificación (opcional)

### Uso:
```javascript
const validation = validateDocument("CC", "12345678");
if (validation.isValid) {
  console.log("Documento válido:", validation.formatted); // "12.345.678"
} else {
  console.log("Error:", validation.message);
}
```

## 📧 Validación de Email

### Uso:
```javascript
const validation = validateEmail("usuario@dominio.com");
if (validation.isValid) {
  console.log("Email válido:", validation.formatted);
} else {
  console.log("Error:", validation.message);
}
```

## 👤 Validación de Nombres

### Uso:
```javascript
const validation = validateName("Juan Carlos", "nombre");
if (validation.isValid) {
  console.log("Nombre válido:", validation.formatted);
} else {
  console.log("Error:", validation.message);
}
```

## 🎂 Validación de Edad

### Tipos de Pasajero:
- **adulto:** 14-120 años
- **menor:** 2-13 años
- **infante:** 0-23 meses

### Uso:
```javascript
const validation = validateAge("1990-05-15", "adulto");
if (validation.isValid) {
  console.log(`Edad válida: ${validation.age} ${validation.unit}`);
} else {
  console.log("Error:", validation.message);
}
```

## 🔧 Validación de Formulario Completo

### Uso:
```javascript
const formData = {
  nombre: "Juan Carlos",
  telefono: "3001234567",
  email: "juan@correo.com",
  documento: "12345678",
  tipo_documento: "CC"
};

const rules = {
  nombre: { type: 'name', fieldName: 'nombre' },
  telefono: { type: 'phone' },
  email: { type: 'email' },
  documento: { type: 'document', documentType: 'CC' }
};

const validation = validateForm(formData, rules);
if (validation.isValid) {
  console.log("Formulario válido");
} else {
  console.log("Errores:", validation.errors);
}
```

## 🎨 Integración en Componentes React

### Ejemplo en QuotePopup:
```javascript
import { validatePhoneNumber, validateEmail, validateName } from '../../utils/validations';

const QuotePopup = () => {
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    const nameValidation = validateName(form.nombre_cliente, 'nombre del cliente');
    if (!nameValidation.isValid) {
      newErrors.nombre_cliente = nameValidation.message;
    }

    // Validar email
    const emailValidation = validateEmail(form.email_cliente);
    if (!emailValidation.isValid) {
      newErrors.email_cliente = emailValidation.message;
    }

    // Validar teléfono
    const phoneValidation = validatePhoneNumber(form.telefono_cliente);
    if (!phoneValidation.isValid) {
      newErrors.telefono_cliente = phoneValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ...resto del componente
};
```

### Ejemplo en PassengerCard:
```javascript
import { validateDocument, getDocumentTypes } from '../../../utils/validations';

const PassengerCard = ({ passenger, onUpdate }) => {
  const tiposDocumento = getDocumentTypes().map(doc => ({
    value: doc.value.toLowerCase(),
    label: doc.label
  }));

  const handleDocumentChange = (value) => {
    const validation = validateDocument(passenger.tipo_documento, value);
    if (validation.isValid && validation.formatted) {
      onUpdate('documento_identidad', validation.formatted);
    } else {
      onUpdate('documento_identidad', value);
    }
  };

  // ...resto del componente
};
```

## 🎯 Validación en Tiempo Real

### Input con validación automática:
```javascript
const [fieldErrors, setFieldErrors] = useState({});

const handleInputChange = (field, value) => {
  // Actualizar valor
  setFormData(prev => ({ ...prev, [field]: value }));
  
  // Validar en tiempo real
  let validation;
  switch (field) {
    case 'telefono':
      validation = validatePhoneNumber(value);
      if (validation.isValid) {
        // Auto-formatear
        setFormData(prev => ({ ...prev, [field]: validation.formatted }));
      }
      break;
    case 'email':
      validation = validateEmail(value);
      break;
    // ... otros casos
  }

  // Actualizar errores
  setFieldErrors(prev => ({
    ...prev,
    [field]: validation.isValid ? null : validation.message
  }));
};
```

## 📋 Lista de Documentos Colombianos

```javascript
import { getDocumentTypes } from '../utils/validations';

const documentTypes = getDocumentTypes();
// Retorna:
// [
//   { value: 'CC', label: 'Cédula de Ciudadanía' },
//   { value: 'TI', label: 'Tarjeta de Identidad' },
//   { value: 'CE', label: 'Cédula de Extranjería' },
//   { value: 'PA', label: 'Pasaporte' },
//   { value: 'RC', label: 'Registro Civil' },
//   { value: 'MS', label: 'Menor sin identificación' }
// ]
```

## 🔄 Auto-formateo

Las validaciones incluyen formateo automático:

- **Teléfonos:** `3001234567` → `300 123 4567`
- **Cédulas:** `12345678` → `12.345.678`
- **Emails:** `USER@DOMAIN.COM` → `user@domain.com`
- **Nombres:** `  juan carlos  ` → `Juan Carlos`

## 🌍 Zona Horaria

Las validaciones de edad usan Luxon con zona horaria de Colombia (`America/Bogota`) para consistencia.

## 🧪 Ejemplo Completo

Revisa el archivo `src/components/examples/ValidationsExample.jsx` para ver todas las validaciones en acción.
