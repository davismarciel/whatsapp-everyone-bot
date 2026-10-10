# Bot de figurinhas para WhatsApp

Envie uma imagem com a legenda `/sticker` em uma conversa privada. O bot devolve uma figurinha estática na mesma conversa, inclusive quando a imagem é enviada pelo número vinculado. Grupos e status são ignorados. Não há servidor HTTP, webhook, domínio, Evolution API, banco de dados ou cache de figurinhas.

## Rodar localmente

Requer Node.js 24.12+ e um WhatsApp que possa vincular um aparelho.

```bash
npm ci
npm test
npm run typecheck
npm start
```

Leia o QR Code no terminal em **WhatsApp → Aparelhos conectados → Conectar aparelho**. A sessão fica em `data/session/`, fora do Git. Defina `SESSION_DIR` para mudar esse caminho.

O bot processa apenas imagens novas de conversas privadas com a legenda exata `/sticker` (sem diferenciar maiúsculas). Após cada conexão, aguarda 90 segundos para descartar mensagens pendentes; pedidos enviados antes de ficar pronto precisam ser reenviados. O bot não solicita reenvio automático de mensagens que não conseguiu descriptografar; nesses casos, a pessoa também precisa reenviar o pedido. A entrada é limitada a 10 MB. A saída tem 512 × 512 pixels e até 100 KB, segundo as [regras de figurinhas estáticas do WhatsApp](https://faq.whatsapp.com/1056840314992666/?locale=pt_BR). Uma identificação criptográfica de cada pedido recebido fica no volume da sessão para evitar respostas duplicadas após reinícios.

Para conter abuso, há um limite em memória de **uma figurinha a cada 10 segundos por conversa**, **10 segundos entre respostas no total**, **10 tentativas por hora no total** e **uma conversão por vez**. Pedidos acima desses limites são ignorados sem resposta. Esses limites são reiniciados quando o processo reinicia; eles reduzem o volume, mas não garantem que o WhatsApp manterá o número ativo. [Os termos do WhatsApp](https://www.whatsapp.com/legal/terms-of-service) restringem mensagens automáticas, e o [Baileys não é oficial](https://github.com/WhiskeySockets/Baileys#disclaimer). Evite usar um número pessoal se não puder aceitar esse risco.

## Rodar com Docker

```bash
docker compose up --build -d
docker compose logs -f bot
```

O volume Docker guarda a sessão entre reinicializações. `docker compose down` mantém o volume; `down -v` apaga a sessão. Nenhuma porta é publicada.

## Instância AWS instalada

Em 9 de outubro de 2026, o bot foi instalado na conta AWS `137687462736`, região `us-east-2` (Ohio), em uma instância `t3.micro` com Amazon Linux 2023. A instância atual é `i-002a6e6c5ac5860d1`, IP público `3.145.186.22`. Esse IP pode mudar após parar e iniciar a instância. O acesso SSH está restrito ao IP de origem configurado na regra do security group `sg-087f701858acba226`; se sua rede mudar, atualize essa regra no console AWS. O contêiner se chama `sticker-bot` e a sessão fica no volume `sticker_session`.

### Acessar a instância

No terminal desta máquina, use a chave privada local para entrar:

```bash
ssh -i /home/davi/.ssh/id_ed25519 -o IdentitiesOnly=yes ec2-user@3.145.186.22
```

Depois do login, os comandos de operação são:

```bash
sudo docker ps --filter name=sticker-bot
sudo docker logs --tail 50 sticker-bot
sudo docker logs -f sticker-bot
```

O último comando acompanha os logs; saia com Ctrl-C. O QR Code de pareamento pode aparecer neles, então não compartilhe essa saída. Para encontrar o IP público atual se ele mudar, consulte a instância `i-002a6e6c5ac5860d1` no [console EC2 em Ohio](https://us-east-2.console.aws.amazon.com/ec2/home?region=us-east-2#Instances:instanceId=i-002a6e6c5ac5860d1) ou execute, após `aws login`:

```bash
aws ec2 describe-instances --region us-east-2 --instance-ids i-002a6e6c5ac5860d1 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

**Baileys não tem painel web próprio.** Ele é uma biblioteca que se conecta ao WhatsApp pelo protocolo WebSocket; a [documentação do Baileys](https://baileys.wiki/docs/intro/) é o site disponível. A antiga interface de gerenciamento pertencia à Evolution API, removida deste projeto. Neste bot, o QR Code e o estado da conexão aparecem nos logs. Nenhuma porta web foi aberta na instância.

Para ler um QR Code **novo**, execute no ambiente que possui a chave SSH:

```bash
ssh -i /home/davi/.ssh/id_ed25519 ec2-user@3.145.186.22 \
  'sudo docker restart sticker-bot >/dev/null && sudo docker logs --since 10s -f sticker-bot'
```

No telefone, vá em **WhatsApp → Aparelhos conectados → Conectar aparelho**. Aguarde a linha `WhatsApp conectado. Pronto para /sticker.` nos logs e pressione Ctrl-C para sair dos logs. O número não fica no código: o vínculo é feito pelo QR Code. Faça um teste enviando uma foto com a legenda `/sticker`.

Para verificar o estado sem mostrar o QR Code:

```bash
ssh -i /home/davi/.ssh/id_ed25519 ec2-user@3.145.186.22 \
  'sudo docker ps --filter name=sticker-bot --format "{{.Names}} {{.Status}}"'
```

Após alterar o código, publique uma nova imagem a partir desta máquina com:

```bash
./scripts/deploy-ec2.sh ec2-user@3.145.186.22 /home/davi/.ssh/id_ed25519
```

Esse comando substitui o contêiner e preserva o volume da sessão. Para encerrar o uso da AWS, termine a instância `i-002a6e6c5ac5860d1` no console EC2. Isso apaga a sessão armazenada no disco da instância.

## Limite do plano gratuito

A AWS confirmou nesta conta o **Free account plan** ativo, com US$ 120 de créditos restantes e término em **2 de abril de 2027**, salvo esgotamento antes dessa data. Segundo a [AWS](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html), esse plano não gera cobrança enquanto permanece ativo; a conta é encerrada quando o prazo ou os créditos terminam, caso não seja convertida para um plano pago. Isso não oferece hospedagem gratuita permanente. Confira os créditos no Billing periodicamente. A instância e a imagem escolhidas constavam como `Free tier eligible` na API da AWS durante o deploy.

O roteiro [aws-free-setup.sh](scripts/aws-free-setup.sh) organiza as três ações manuais: conferir o Billing, autenticar no AWS CLI e ler o QR Code. A biblioteca [Baileys é uma integração não oficial](https://github.com/WhiskeySockets/docs/blob/main/quickstart.mdx), então a conexão depende da compatibilidade com o WhatsApp.
