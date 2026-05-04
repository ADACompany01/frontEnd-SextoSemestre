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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
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

export default function ListService(props) {
  const [servicoData, setservicoData] = React.useState(null);
  const [servicoId, setservicoId] = React.useState("");
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/signin" />;
  }

  const handleConsultaServico = async () => {
    try {
      const response = await fetch(`https://api-ada-company.vercel.app/servico/${servicoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar serviço');
      }
      const data = await response.json();
      setservicoData(data);
    } catch (error) {
      console.error('Erro ao buscar serviço:', error);
      setservicoData(null);
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
            Consultar Serviço
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="ID do Serviço"
              fullWidth
              value={servicoId}
              onChange={(e) => setservicoId(e.target.value)}
            />
            <Button variant="contained" onClick={handleConsultaServico}>
              Consultar
            </Button>
          </Box>
          
          {servicoData && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">Dados do Serviço:</Typography>
              
              <TextField
                label="ID"
                value={servicoData._id || ''}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              
              <TextField
                label="Nome"
                value={servicoData.nome || ''}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              
              <TextField
                label="Valor"
                value={servicoData.valor || ''}
                InputProps={{ readOnly: true }}
                fullWidth
                type="number"
              />
              
              <FormControl fullWidth>
                <FormLabel>Tipo de Serviço</FormLabel>
                <Select
                  value={servicoData.tipoServico || ''}
                  disabled
                  fullWidth
                >
                  <MenuItem value="Venda">Venda</MenuItem>
                  <MenuItem value="Serviço">Serviço</MenuItem>
                </Select>
              </FormControl>
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
