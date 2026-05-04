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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
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
    width: '800px', // Aumentei a largura para acomodar mais campos
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

const Section = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

export default function ListFunc(props) {
  const [funcionarioData, setFuncionarioData] = React.useState(null);
  const [funcionarioId, setFuncionarioId] = React.useState("");
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/signin" />;
  }

  const handleConsultaFuncionario = async () => {
    try {
      const response = await fetch(`https://api-ada-company.vercel.app/funcionario/${funcionarioId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar funcionário');
      }
      const data = await response.json();
      setFuncionarioData(data);
    } catch (error) {
      console.error('Erro ao buscar funcionário:', error);
      setFuncionarioData(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <SitemarkIcon />
          <Typography component="h1" variant="h4">
            Consultar Funcionário
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="ID do Funcionário"
              fullWidth
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
            />
            <Button variant="contained" onClick={handleConsultaFuncionario}>
              Consultar
            </Button>
          </Box>

          {funcionarioData && (
            <Box sx={{ mt: 2 }}>
              <Section>
                <Typography variant="h6" gutterBottom>Informações Básicas</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="ID"
                      value={funcionarioData._id || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nome do Funcionário"
                      value={funcionarioData.nomeFuncionario || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Cargo"
                      value={funcionarioData.cargo || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Section>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Endereço</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="CEP"
                        value={funcionarioData.endereco[0]?.cep || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        label="Logradouro"
                        value={funcionarioData.endereco[0]?.logradouro || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Complemento"
                        value={funcionarioData.endereco[0]?.complemento || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Bairro"
                        value={funcionarioData.endereco[0]?.bairro || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Cidade"
                        value={funcionarioData.endereco[0]?.localidade || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="UF"
                        value={funcionarioData.endereco[0]?.uf || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="DDD"
                        value={funcionarioData.endereco[0]?.ddd || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Informações do Usuário</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nome Completo"
                        value={funcionarioData.usuario[0]?.nomeCompleto || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        value={funcionarioData.usuario[0]?.email || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Telefone"
                        value={funcionarioData.usuario[0]?.telefone || ''}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <FormLabel>Tipo de Usuário</FormLabel>
                        <Select
                          value={funcionarioData.usuario[0]?.tipoUsuario || ''}
                          disabled
                        >
                          <MenuItem value="funcionario">Funcionário</MenuItem>
                          <MenuItem value="admin">Administrador</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {funcionarioData.chatBot && funcionarioData.chatBot.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Histórico de Chat</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {funcionarioData.chatBot.map((chat) => (
                        <Box key={chat.id_chatbot} sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="ID do Chat"
                                value={chat.id_chatbot || ''}
                                InputProps={{ readOnly: true }}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Data"
                                value={formatDate(chat.data)}
                                InputProps={{ readOnly: true }}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Texto"
                                value={chat.texto_chat || ''}
                                InputProps={{ readOnly: true }}
                                fullWidth
                                multiline
                                rows={2}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
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
