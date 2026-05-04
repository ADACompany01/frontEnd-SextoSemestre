import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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

const FormContainer = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: 400,
  margin: 'auto',
  marginTop: theme.spacing(4), // Added margin top
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
}));


export default function ClientAccess(props) {
  const [clienteData, setClienteData] = React.useState(null);
  const [token] = React.useState(localStorage.getItem('token'));
  const [feedback, setFeedback] = React.useState('');
  const [rating, setRating] = React.useState(0);
  const [supportMessage, setSupportMessage] = React.useState('');
  const [orcamentoData, setOrcamentoData] = React.useState({
    email: '',
    publicoAlvo: '',
    servicos: [],
    prazo: '',
    descricao: '',
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      if (checked) {
        setOrcamentoData({ ...orcamentoData, servicos: [...orcamentoData.servicos, value] });
      } else {
        setOrcamentoData({ ...orcamentoData, servicos: orcamentoData.servicos.filter((item) => item !== value) });
      }
    } else {
      setOrcamentoData({ ...orcamentoData, [name]: value });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Orçamento enviado:', orcamentoData);
    // Aqui você pode adicionar a lógica para enviar os dados do orçamento para o backend
  };


  React.useEffect(() => {
    if (!token) return;
    const fetchClientData = async () => {
      try {
        const decodedToken = decodeToken(token);
        const id = decodedToken?.id;
        if (!id) throw new Error('Token inválido ou id ausente');
        const response = await fetch(`https://api-ada-company.vercel.app/cliente/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Erro ao buscar cliente');
        const data = await response.json();
        setClienteData(data);
      } catch (error) {
        console.error('Erro ao buscar cliente:', error);
      }
    };
    fetchClientData();
  }, [token]);

  if (!token) return <Navigate to="/signin" />;

  const formatValue = (value) => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value !== null) return JSON.stringify(value);
    return value || '';
  };

  const handleFeedbackSubmit = () => {
    console.log('Feedback enviado:', { feedback, rating });
    setFeedback('');
    setRating(0);
  };

  const handleSupportSubmit = () => {
    console.log('Mensagem de suporte enviada:', supportMessage);
    setSupportMessage('');
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <SitemarkIcon />
          <Typography component="h1" variant="h4">
            Cliente
          </Typography>
          {clienteData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Informações:</Typography>
              <TextField label="Nome Cliente" fullWidth value={formatValue(clienteData.nomeCliente)} disabled />
              <TextField label="E-mail do Usuário" fullWidth value={formatValue(clienteData.usuario?.[0]?.email)} disabled />
            </Box>
          )}

          {/* Painel de progresso */}
          <Box sx={{ my: 4 }}>
            <Typography variant="h6">Status do Projeto</Typography>
            <Stepper activeStep={1}>
              {['Orçamento Enviado', 'Em Análise', 'Em Desenvolvimento', 'Concluído'].map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Indicadores de Acessibilidade */}
          <Typography variant="h6">Indicadores de Acessibilidade</Typography>
          <Box sx={{ mt: 2, mb: 4 }}>
            <Typography>WCAG Compliance</Typography>
            <Stepper alternativeLabel nonLinear>
              <Step>
                <StepLabel>WCAG AA</StepLabel>
              </Step>
              <Step>
                <StepLabel>WCAG AAA</StepLabel>
              </Step>
            </Stepper>
            <Typography>Taxa de Leitura: 95%</Typography>
            <Typography>Contraste: 100%</Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Histórico de Pedidos */}
          <Typography variant="h6">Histórico de Pedidos</Typography>
          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Serviço</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>01/11/2024</TableCell>
                <TableCell>Criação de Site</TableCell>
                <TableCell>Em Análise</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Central de Suporte */}
          <Typography variant="h6">Central de Suporte</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography>Envie suas dúvidas ou entre em contato conosco:</Typography>
            <TextField
              label="Mensagem de Suporte"
              multiline
              rows={4}
              fullWidth
              value={supportMessage}
              onChange={(event) => setSupportMessage(event.target.value)}
              sx={{ mt: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleSupportSubmit}
              sx={{ mt: 2 }}
            >
              Enviar Mensagem
            </Button>
          </Box>

          <Accordion sx={{ mt: 4 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>FAQ - Perguntas Frequentes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle1">Como funciona o serviço?</Typography>
              <Typography variant="body2">
                Oferecemos serviços de criação, adaptação e consultoria para garantir acessibilidade digital.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Qual o prazo para entrega?</Typography>
              <Typography variant="body2">
                O prazo depende do escopo do projeto, mas normalmente para criação de um projeto do zero é de 6 a 12 semanas.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 4 }} />

          {/* Feedback */}
          <Typography variant="h6">Deixe seu Feedback</Typography>
          <Box sx={{ mt: 2 }}>
            <Rating
              name="rating"
              value={rating}
              onChange={(event, newValue) => setRating(newValue)}
            />
            <TextField
              label="Seu Feedback"
              multiline
              rows={4}
              fullWidth
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              sx={{ mt: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleFeedbackSubmit}
              sx={{ mt: 2 }}
            >
              Enviar Feedback
            </Button>
          </Box>
        </Card>
        <FormContainer>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Solicitação de Orçamento
            </Typography>

            {/* Nome do cliente (preenchido automaticamente se disponível) */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="nomeCliente"
              label="Nome da Empresa"
              name="nomeCliente"
              value={clienteData?.nomeCliente || ''}
              
            />

            {/* Email Corporativo */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Corporativo"
              name="email"
              value={clienteData?.usuario?.[0]?.email || orcamentoData.email}
              onChange={handleChange}
              disabled={!!clienteData?.usuario?.[0]?.email}
            />

            {/* Público Alvo */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="publicoAlvo"
              label="Público Alvo"
              name="publicoAlvo"
              autoComplete="publicoAlvo"
              value={orcamentoData.publicoAlvo}
              onChange={handleChange}
            />

            {/* Serviços Desejados */}
            <Typography variant="h6" sx={{ mt: 2 }}>
              Serviços Desejados:
            </Typography>
            <Box>
              <div>
                <input
                  type="checkbox"
                  id="criacaoSite"
                  name="servicos"
                  value="Criação de Site"
                  onChange={handleChange}
                  checked={orcamentoData.servicos.includes("Criação de Site")}
                />
                <label htmlFor="criacaoSite">Criação de Site</label>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="adaptacaoSite"
                  name="servicos"
                  value="Adaptação de Site"
                  onChange={handleChange}
                  checked={orcamentoData.servicos.includes("Adaptação de Site")}
                />
                <label htmlFor="adaptacaoSite">Adaptação de Site</label>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="consultoria"
                  name="servicos"
                  value="Consultoria"
                  onChange={handleChange}
                  checked={orcamentoData.servicos.includes("Consultoria")}
                />
                <label htmlFor="consultoria">Consultoria</label>
              </div>
            </Box>


            {/* Informações adicionais */}
            <TextField
              margin="normal"
              fullWidth
              id="descricao"
              label="Informações Adicionais"
              name="descricao"
              multiline
              rows={4}
              value={orcamentoData.descricao || ''}
              onChange={handleChange}
            />

            {/* Botão de Envio */}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Enviar Solicitação
            </Button>
          </Box>
        </FormContainer>
      </SignUpContainer>
    </AppTheme>
  );
}

function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}
