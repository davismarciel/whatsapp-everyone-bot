export const commandTtls = {
  // Configurações para o comando "futebolbr"
  futebolbr: {
    // Tempo para evitar comandos duplicados
    duplicateTtl: 60_000, // 60 segundos
    // Tempo para manter o resultado em cache
    cacheTtl: 5 * 60 * 1000, // 5 minutos
  },
  // Configurações para o comando "everyone"
  everyone: {
    // Tempo para evitar comandos duplicados
    duplicateTtl: 15_000, // 15 segundos
    // Tempo para manter o resultado em cache
    cacheTtl: 60_000, // 60 segundos
  },
  // Configurações para o comando "sticker"
  sticker: {
    duplicateTtl: 0, // Sem prevenção de duplicidade
    cacheTtl: 0, // Sem cache
  },
};
