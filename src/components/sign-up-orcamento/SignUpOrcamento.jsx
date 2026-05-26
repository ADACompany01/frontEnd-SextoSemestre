import * as React from "react";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { Navigate } from "react-router-dom";
import AppTheme from "../shared-theme/AppTheme";
import ColorModeSelect from "../shared-theme/ColorModeSelect";

const Page = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  padding: theme.spacing(12, 2, 6),
  background:
    "linear-gradient(135deg, rgba(79, 81, 212, 0.10) 0%, rgba(255, 255, 255, 1) 42%, rgba(20, 163, 131, 0.10) 100%)",
  color: "#0b2447",
}));

const Shell = styled(Box)(({ theme }) => ({
  width: "min(1120px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "0.8fr 1.2fr",
  gap: theme.spacing(3),
  alignItems: "stretch",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

const IntroPanel = styled(Paper)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(4),
  border: "1px solid rgba(25, 55, 109, 0.14)",
  background: "#0b2447",
  color: "#ffffff",
  boxShadow: "0 18px 45px rgba(11, 36, 71, 0.18)",
}));

const FormPanel = styled(Paper)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(4),
  border: "1px solid rgba(79, 81, 212, 0.16)",
  boxShadow: "0 18px 45px rgba(11, 36, 71, 0.12)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
  },
}));

const IconBadge = styled(Box)(() => ({
  width: 44,
  height: 44,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: alpha("#4f51d4", 0.12),
  color: "#4f51d4",
  flexShrink: 0,
}));

const FieldGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#f8faff",
  },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
    borderColor: "#4f51d4",
  },
};

export default function SignUpOrcamento(props) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const formData = {
      _id: parseInt(data.get("_id"), 10),
      clienteId: parseInt(data.get("clienteId"), 10),
      validadeOrcamento: data.get("validadeOrcamento"),
      dataCriacao: data.get("dataCriacao"),
      valorTotal: parseFloat(data.get("valorTotal")),
      tipoServico: data.get("tipoServico"),
      statusOrcamento: data.get("statusOrcamento"),
      descricao: data.get("descricao"),
      emailVendedor: data.get("emailVendedor"),
    };

    try {
      const response = await fetch("https://api-ada-company.vercel.app/api/auth/registerOrcamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao cadastrar orçamento: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log("Orçamento cadastrado com sucesso:", result);
      alert("Orçamento cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar dados para a API:", error);
      alert(`Erro ao cadastrar orçamento: ${error.message}`);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 2 }} />
      <Page>
        <Shell>
          <IntroPanel elevation={0}>
            <Stack spacing={3} sx={{ height: "100%" }}>
              <IconBadge sx={{ background: "rgba(255, 255, 255, 0.12)", color: "#ffffff" }}>
                <RequestQuoteIcon />
              </IconBadge>

              <Box>
                <Typography component="h1" variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  Cadastrar orçamento
                </Typography>
                <Typography sx={{ color: "rgba(255, 255, 255, 0.78)", lineHeight: 1.7 }}>
                  Registre os dados da proposta, acompanhe o status e mantenha as informações
                  comerciais organizadas para o cliente.
                </Typography>
              </Box>

              <Stack spacing={2} sx={{ mt: "auto" }}>
                {[
                  "Dados comerciais do cliente",
                  "Validade e data de criação",
                  "Descrição clara do serviço",
                ].map((item) => (
                  <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleOutlineIcon sx={{ color: "#14a383" }} />
                    <Typography>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </IntroPanel>

          <FormPanel elevation={0}>
            <Stack spacing={3}>
              <Box>
                <Typography component="h2" variant="h5" sx={{ color: "#19376d", fontWeight: 800 }}>
                  Dados do orçamento
                </Typography>
                <Typography sx={{ color: "#43536f", mt: 0.5 }}>
                  Preencha os campos abaixo para gerar um orçamento completo.
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <FieldGrid>
                  <FormControl>
                    <FormLabel htmlFor="_id">ID do orçamento</FormLabel>
                    <TextField name="_id" required fullWidth id="_id" type="number" placeholder="123" sx={fieldStyles} />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="clienteId">ID do cliente</FormLabel>
                    <TextField name="clienteId" required fullWidth id="clienteId" type="number" placeholder="456" sx={fieldStyles} />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="validadeOrcamento">Validade do orçamento</FormLabel>
                    <TextField name="validadeOrcamento" required fullWidth id="validadeOrcamento" type="date" sx={fieldStyles} />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="dataCriacao">Data de criação</FormLabel>
                    <TextField name="dataCriacao" required fullWidth id="dataCriacao" type="date" sx={fieldStyles} />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="valorTotal">Valor total</FormLabel>
                    <TextField name="valorTotal" required fullWidth id="valorTotal" type="number" placeholder="1000" sx={fieldStyles} />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="tipoServico">Tipo de serviço</FormLabel>
                    <Select name="tipoServico" required fullWidth id="tipoServico" defaultValue="" displayEmpty sx={fieldStyles}>
                      <MenuItem value="" disabled>Selecione o tipo</MenuItem>
                      <MenuItem value="Venda">Venda</MenuItem>
                      <MenuItem value="Serviço">Serviço</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="statusOrcamento">Status do orçamento</FormLabel>
                    <Select name="statusOrcamento" required fullWidth id="statusOrcamento" defaultValue="Pendente" sx={fieldStyles}>
                      <MenuItem value="Pendente">Pendente</MenuItem>
                      <MenuItem value="Em análise">Em análise</MenuItem>
                      <MenuItem value="Aprovado">Aprovado</MenuItem>
                      <MenuItem value="Recusado">Recusado</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="emailVendedor">Email do vendedor</FormLabel>
                    <TextField name="emailVendedor" required fullWidth id="emailVendedor" type="email" placeholder="vendedor@email.com" sx={fieldStyles} />
                  </FormControl>
                </FieldGrid>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <FormLabel htmlFor="descricao">Descrição</FormLabel>
                  <TextField
                    name="descricao"
                    required
                    fullWidth
                    id="descricao"
                    placeholder="Descreva o escopo do serviço, entregáveis e observações importantes"
                    multiline
                    rows={4}
                    sx={fieldStyles}
                  />
                </FormControl>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: "8px",
                    background: "rgba(79, 81, 212, 0.06)",
                    color: "#19376d",
                  }}
                >
                  <BadgeOutlinedIcon />
                  <CalendarMonthIcon />
                  <AttachMoneyIcon />
                  <DescriptionOutlinedIcon />
                  <EmailOutlinedIcon />
                  <Typography sx={{ color: "#43536f" }}>
                    Revise IDs, datas e valor antes de concluir o cadastro.
                  </Typography>
                </Stack>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{
                    mt: 3,
                    minHeight: 48,
                    borderRadius: "8px",
                    backgroundColor: "#4f51d4",
                    fontWeight: 800,
                    "&:hover": { backgroundColor: "#19376d" },
                  }}
                >
                  Cadastrar orçamento
                </Button>
              </Box>
            </Stack>
          </FormPanel>
        </Shell>
      </Page>
    </AppTheme>
  );
}
