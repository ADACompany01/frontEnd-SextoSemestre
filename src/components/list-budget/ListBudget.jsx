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

export default function ListBudget(props) {
  const [orcamentoData, setOrcamentoData] = React.useState(null);
  const [orcamentoId, setOrcamentoId] = React.useState("");
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/signin" />;
  }

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (value instanceof Date) {
      return new Date(value).toLocaleDateString();
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value || '';
  };

  const handleConsultaBudget = async () => {
    try {
      const response = await fetch(`https://api-ada-company.vercel.app/orcamento/${orcamentoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar orçamento');
      }
      const data = await response.json();
      setOrcamentoData(data);
      console.log('Dados recebidos:', data);
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      setOrcamentoData(null);
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
            Consultar Orçamento
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="ID do Orçamento"
              fullWidth
              value={orcamentoId}
              onChange={(e) => setOrcamentoId(e.target.value)}
            />
            <Button variant="contained" onClick={handleConsultaBudget}>
              Consultar
            </Button>
          </Box>
          {orcamentoData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Dados do Orçamento:</Typography>
              <TextField
                label="ID"
                fullWidth
                value={formatValue(orcamentoData._id)}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="ID do Cliente"
                fullWidth
                value={formatValue(orcamentoData.clienteId)}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="Validade do Orçamento"
                fullWidth
                value={formatValue(orcamentoData.validadeOrcamento)}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="Data de Criação"
                fullWidth
                value={formatValue(orcamentoData.dataCriacao)}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="Valor Total"
                fullWidth
                value={formatValue(orcamentoData.valorTotal)}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="Tipo de Serviço"
                fullWidth
                value={formatValue(orcamentoData.tipoServico)}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="Status do Orçamento"
                fullWidth
                value={formatValue(orcamentoData.statusOrcamento)}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="Descrição"
                fullWidth
                value={formatValue(orcamentoData.descricao)}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="Email do Vendedor"
                fullWidth
                value={formatValue(orcamentoData.emailVendedor)}
                disabled
                sx={{ mb: 2 }}
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
