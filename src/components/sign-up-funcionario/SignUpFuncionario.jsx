import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../shared-theme/AppTheme';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from './CustomIcons';
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
  height: '100vh',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
}));

export default function SignUpFuncionario(props) {
  const token = localStorage.getItem('token');

  if (!token) {
   return <Navigate to="/signin" />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const formData = {
      nome_completo: data.get('nome_completo'),
      email: data.get('email'),
      telefone: data.get('telefone'),
      senha: data.get('senha'),
    };

    try {
      const response = await fetch('http://adacompany.duckdns.org:3000/funcionarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao registrar funcionário: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log(result);
      alert('Funcionário cadastrado com sucesso!');
      
      // Reset form
      event.target.reset();
    } catch (error) {
      console.error('Erro:', error);
      alert(`Erro ao cadastrar funcionário: ${error.message}`);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <SignUpContainer direction="column" justifyContent="center">
        <Card variant="outlined">
          <SitemarkIcon />
          <Typography component="h1" variant="h4">
            Cadastrar Funcionário
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl>
              <FormLabel htmlFor="nome_completo">Nome Completo</FormLabel>
              <TextField 
                name="nome_completo" 
                required 
                fullWidth 
                id="nome_completo" 
                placeholder="Digite seu nome completo" 
              />
            </FormControl>
            
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField 
                name="email" 
                required 
                fullWidth 
                id="email" 
                type="email"
                placeholder="seu@email.com" 
              />
            </FormControl>
            
            <FormControl>
              <FormLabel htmlFor="telefone">Telefone</FormLabel>
              <TextField 
                name="telefone" 
                required 
                fullWidth 
                id="telefone" 
                placeholder="(00) 00000-0000" 
              />
            </FormControl>
            
            <FormControl>
              <FormLabel htmlFor="senha">Senha</FormLabel>
              <TextField 
                name="senha" 
                required 
                fullWidth 
                type="password" 
                id="senha" 
                placeholder="••••••" 
              />
            </FormControl>
            
            <Button type="submit" fullWidth variant="contained">
              Cadastrar
            </Button>
          </Box>
          <Divider>
            <Typography sx={{ color: 'text.secondary' }}>ou</Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button fullWidth variant="outlined" startIcon={<GoogleIcon />}>
              Login com Google
            </Button>
            <Button fullWidth variant="outlined" startIcon={<FacebookIcon />}>
              Login com Facebook
            </Button>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
