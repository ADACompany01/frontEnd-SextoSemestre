import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../shared-theme/AppTheme';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from './CustomIcons';
import ColorModeSelect from '../shared-theme/ColorModeSelect';

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
  height: '2000px',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
}));

export default function ListClient(props) {
  const [clienteData, setClienteData] = React.useState(null);
  const [clientId, setClientId] = React.useState("");

  const handleConsultaCliente = async () => {
    try {
      const response = await fetch(`https://api-ada-company.vercel.app/cliente/${clientId}`);
      if (!response.ok) {
        throw new Error('Cliente não encontrado');
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
              <pre>{JSON.stringify(clienteData, null, 2)}</pre>
            </Box>
          )}
        </Card>
        <Divider>
          <Typography sx={{ color: 'text.secondary' }}>ou</Typography>
        </Divider>
        <FormControl>
              <FormLabel htmlFor="_id">ID</FormLabel>
              <TextField name="_id" required fullWidth id="_id" placeholder="ID" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="nomeCliente">Nome do Cliente</FormLabel>
              <TextField name="nomeCliente" required fullWidth id="nomeCliente" placeholder="Nome do Cliente" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="telefone">Telefone</FormLabel>
              <TextField name="telefone" required fullWidth id="telefone" placeholder="(11) 12345-6789" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="cnpj">CNPJ</FormLabel>
              <TextField name="cnpj" required fullWidth id="cnpj" placeholder="12.345.678/0001-99" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="coordinates">Coordenadas (Localização)</FormLabel>
              <TextField name="coordinates" required fullWidth id="coordinates" placeholder="-23.5505, -46.6333" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="cep">CEP</FormLabel>
              <TextField name="cep" required fullWidth id="cep" placeholder="12345-678" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="logradouro">Logradouro</FormLabel>
              <TextField name="logradouro" required fullWidth id="logradouro" placeholder="Rua das Flores" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="complemento">Complemento</FormLabel>
              <TextField name="complemento" fullWidth id="complemento" placeholder="Apto 101" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="bairro">Bairro</FormLabel>
              <TextField name="bairro" required fullWidth id="bairro" placeholder="Centro" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="localidade">Localidade</FormLabel>
              <TextField name="localidade" required fullWidth id="localidade" placeholder="Cidade" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="uf">UF</FormLabel>
              <TextField name="uf" required fullWidth id="uf" placeholder="SP" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="estado">Estado</FormLabel>
              <TextField name="estado" required fullWidth id="estado" placeholder="São Paulo" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="ddd">DDD</FormLabel>
              <TextField name="ddd" required fullWidth id="ddd" placeholder="11" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField name="email" required fullWidth id="email" placeholder="your@email.com" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="senha">Senha</FormLabel>
              <TextField name="senha" required fullWidth type="password" id="senha" placeholder="••••••" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="tipoUsuario">Tipo de Usuário</FormLabel>
              <TextField name="tipoUsuario" required fullWidth id="tipoUsuario" placeholder="Cliente" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="telefoneUsuario">Telefone do Usuário</FormLabel>
              <TextField name="telefoneUsuario" required fullWidth id="telefoneUsuario" placeholder="(11) 12345-6789" />
            </FormControl>
      </SignUpContainer>
    </AppTheme>
  );
}
