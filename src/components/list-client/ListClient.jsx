import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../shared-theme/AppTheme';
import { SitemarkIcon } from './CustomIcons';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { Navigate } from 'react-router-dom';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: '100%',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
}));

export default function ListClient(props) {
  const [clienteData, setClienteData] = React.useState(null);
  const [clientId, setClientId] = React.useState("");
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/signin" />;
  }

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value || '';
  };

  const handleConsultaCliente = async () => {
    try {
      const response = await fetch(`https://api-ada-company.vercel.app/cliente/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar cliente');
      }
      const data = await response.json();
      setClienteData(data);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      setClienteData(null);
    }
  };

  return (
    <AppTheme {...props}>
    <CssBaseline enableColorScheme />
    <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
    <SignUpContainer direction="column" justifyContent="space-between">
      <Card variant="outlined">
        <SitemarkIcon />
        <Typography component="h1" variant="h4">
          Consultar Cliente
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="ID do Cliente"
            fullWidth
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
          <Button variant="contained" onClick={handleConsultaCliente}>
            Consultar
          </Button>
        </Box>
        {clienteData && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Dados do Cliente:</Typography>
            <TextField
              label="_id"
              fullWidth
              value={formatValue(clienteData._id)}
              disabled
            />
            <TextField
              label="Nome Cliente"
              fullWidth
              value={formatValue(clienteData.nomeCliente)}
              disabled
            />
            <TextField
              label="Telefone"
              fullWidth
              value={formatValue(clienteData.telefone)}
              disabled
            />
            <TextField
              label="CEP"
              fullWidth
              value={formatValue(clienteData.endereco?.[0]?.cep)}
              disabled
            />
            <TextField
              label="Logradouro"
              fullWidth
              value={formatValue(clienteData.endereco?.[0]?.logradouro)}
              disabled
            />
            <TextField
              label="Complemento"
              fullWidth
              value={formatValue(clienteData.endereco?.[0]?.complemento)}
              disabled
            />
            <TextField
              label="Bairro"
              fullWidth
              value={formatValue(clienteData.endereco?.[0]?.bairro)}
              disabled
            />
            <TextField
              label="Localidade"
              fullWidth
              value={formatValue(clienteData.endereco?.[0]?.localidade)}
              disabled
            />
            <TextField
              label="UF"
              fullWidth
              value={formatValue(clienteData.endereco?.[0]?.uf)}
              disabled
            />
            <TextField
              label="Estado"
              fullWidth
              value={formatValue(clienteData.endereco?.[0]?.estado)}
              disabled
            />
            <TextField
              label="DDD"
              fullWidth
              value={formatValue(clienteData.endereco?.[0]?.ddd)}
              disabled
            />
            <TextField
              label="Coordenadas"
              fullWidth
              value={formatValue(clienteData.localizacao?.[0]?.coordinates)}
              disabled
            />
            <TextField
              label="CNPJ"
              fullWidth
              value={formatValue(clienteData.cnpj)}
              disabled
            />
            <TextField
              label="Email"
              fullWidth
              value={formatValue(clienteData.usuario?.[0]?.email)}
              disabled
            />
            <TextField
              label="Senha"
              fullWidth
              value={formatValue(clienteData.usuario?.[0]?.senha)}
              disabled
            />
            <TextField
              label="Tipo de Usuário"
              fullWidth
              value={formatValue(clienteData.usuario?.[0]?.tipoUsuario)}
              disabled
            />
            <TextField
              label="Telefone do Usuário"
              fullWidth
              value={formatValue(clienteData.usuario?.[0]?.telefone)}
              disabled
            />
            <TextField
              label="Nome Completo do Usuário"
              fullWidth
              value={formatValue(clienteData.usuario?.[0]?.nomeCompleto)}
              disabled
            />
          </Box>
        )}
      </Card>
      <Divider>
        <Typography sx={{ color: 'text.secondary' }}>ou</Typography>
      </Divider>
    </SignUpContainer>
  </AppTheme>
  );
}
