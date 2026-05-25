import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpClient.css';

export default function SignUpClient() {
  const [formData, setFormData] = useState({
    nome_completo: '',
    cnpj: '',
    email: '',
    telefone: '',
    senha: '',
  });
  const navigate = useNavigate();
  
//  let apiUrl = 'http://adacompany.duckdns.org/api';
//   if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//     apiUrl = 'http://localhost:3001';
//   }

  const apiUrl = 'http://apiadacompany.duckdns.org/api';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/clientes/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Cliente cadastrado com sucesso!');
        setFormData({
          nome_completo: '',
          cnpj: '',
          email: '',
          telefone: '',
          senha: '',
        });
        navigate('/signin');
      } else {
        alert('Erro ao cadastrar cliente.');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
    }
  };

  const getFieldLabel = (fieldName) => {
    const labels = {
      nome_completo: 'Nome Completo',
      cnpj: 'CNPJ',
      email: 'Email',
      telefone: 'Telefone',
      senha: 'Senha'
    };
    return labels[fieldName] || fieldName;
  };

  const getFieldType = (fieldName) => {
    return fieldName === 'senha' ? 'password' : 'text';
  };

  const getFieldPlaceholder = (fieldName) => {
    const placeholders = {
      nome_completo: 'Digite seu nome completo',
      cnpj: '00.000.000/0000-00',
      email: 'seu@email.com',
      telefone: '(00) 00000-0000',
      senha: 'Digite sua senha'
    };
    return placeholders[fieldName] || `Digite ${fieldName}`;
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Cadastro de Cliente</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          {Object.keys(formData).map((field) => (
            <div className="form-group" key={field}>
              <label>{getFieldLabel(field)}</label>
              <input
                type={getFieldType(field)}
                name={field}
                value={formData[field] || ''}
                onChange={handleChange}
                placeholder={getFieldPlaceholder(field)}
                required
              />
            </div>
          ))}
          <button type="submit" className="signup-button">Cadastrar</button>
        </form>

        <div className="signup-divider">ou</div>

        <div className="signup-social-buttons">
          <button>Login com Google</button>
          <button>Login com Facebook</button>
        </div>
      </div>
    </div>
  );
}
