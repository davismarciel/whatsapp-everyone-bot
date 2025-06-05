# 🤖 WhatsApp Bot – Automação com NestJS & Evolution API

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-Backend-red?style=for-the-badge&logo=nestjs" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Docker-Container-2496ED?style=for-the-badge&logo=docker" />
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis" />
  <img src="https://img.shields.io/badge/Gemini%20API-IA-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Football%20Data-Dados%20Futebol-green?style=for-the-badge" />
</p>

## 📌 Visão Geral

Este projeto é um bot de WhatsApp inteligente criado com **NestJS**, que utiliza a **Evolution API** para gerenciar instâncias do WhatsApp e automatizar interações.  
Conta com recursos de IA, geração de figurinhas, informações esportivas e automações para grupos e contatos.

---

## ✨ Funcionalidades

- 🎨 Conversão de imagens em figurinhas com o comando `/sticker`
- 🧑‍🤝‍🧑 Menção a todos os membros de um grupo com `/everyone`
- ⚽ Consulta de partidas e placares do Brasileirão com `/futebolbr`
- 🤖 Integração com o Google Gemini API para respostas com IA via `/gemini`
- ⚙️ Rate limiting com Bottleneck, LRU Cache e Redis
- 🔁 Suporte a múltiplas instâncias e ambientes com Docker e `.env`

---

## 🧱 Tecnologias Utilizadas

| Camada        | Tecnologias                                          |
|---------------|------------------------------------------------------|
| Backend       | NestJS, TypeScript, Axios, Class Validator           |
| Mensageria    | Evolution API (Webhooks via Docker)                  |
| IA            | Gemini API (Google Generative AI)                    |
| APIs          | Football-Data.org (dados do Brasileirão)            |
| Banco de Dados| PostgreSQL via Prisma ORM                            |
| Cache         | Redis + LRU Cache                                    |
| DevOps        | Docker, Docker Compose                               |

---

## 🚀 Como Executar

**Pré-requisitos:** Docker + Docker Compose

```bash
# 1. Clone o repositório
git clone <repo-url>
cd <repo-folder>

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas chaves e credenciais

# 3. Suba os serviços com Docker
docker compose up --build
```

Após isso:

- Acesse o painel da Evolution API em `http://localhost:8080`
- Crie uma nova instância
- Leia o QR Code com o número de WhatsApp do seu bot

---

## 📡 Configuração do Webhook (Evolution API)

Para que o bot funcione corretamente, configure o webhook seguindo os passos abaixo:

### ✅ Etapas obrigatórias:

1. **Habilite o Webhook**
   - Ative a opção **Enabled**

2. **Configure a URL do Webhook**
   - Se estiver usando NGROK localmente:
     ```bash
     ngrok http 3000
     ```
   - Copie a URL gerada (ex: `https://abc123.ngrok.io`)
   - Configure o webhook com:  
     `https://abc123.ngrok.io/webhook`

3. **Ative as opções adicionais**
   - **Webhook Base64**: ativado ✅ (necessário para envio de figurinhas)

4. **Selecione apenas os eventos abaixo:**
   - ✅ `MESSAGES_UPSERT`
   - ✅ `SEND_MESSAGE`

⚠️ *Não habilite outros eventos para evitar sobrecarga de dados desnecessários.*

---

## 📬 Contato

Desenvolvido por [Davi Sá Marciel](https://github.com/davimarciel)  
Açailândia - Maranhão | Sistemas de Informação (2024–2028)

---

## 🛠️ Licença

Este projeto está licenciado sob a licença MIT.


---

## ⚠️ Observação sobre o Redis

O uso do Redis está **desativado por padrão** devido a bugs conhecidos na integração com a Evolution API.  
Para mais informações, consulte a [documentação oficial](https://doc.evolution-api.com/v1/pt/get-started/introduction) e o [repositório da Evolution API](https://github.com/EvolutionAPI/evolution-api).
