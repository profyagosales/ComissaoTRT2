import { createSupabaseServerClient } from "@/lib/supabase-server";

export type ResumoPosicoes = {
  candidatosNaFrenteOrdem: number;
  posicaoEfetivaOrdem: number;
  candidatosNaFrenteLista: number;
  posicaoEfetivaLista: number;
};

export type ConcursoResumo = {
  totalAprovados: number;
  totalAprovadosAmpla: number;
  totalAprovadosPcd: number;
  totalAprovadosPpp: number;
  totalAprovadosIndigena: number;
  totalNomeados: number;
  totalNomeadosAmpla: number;
  totalNomeadosPcd: number;
  totalNomeadosPpp: number;
  totalNomeadosIndigena: number;
};

export type PainelAtual = {
  id: string;
  ano: number;
  mes: number;
  vagas_loa_jt: number | null;
  vagas_autorizadas_jt: number | null;
  vagas_autorizadas_trt2: number | null;
  vagas_autorizadas_trt2_tjaa: number | null;
  vagas_pendentes_csjt: number | null;
  cargos_vagos_trt2_total: number | null;
  cargos_vagos_trt2_onerosos: number | null;
  cargos_vagos_trt2_nao_onerosos: number | null;
  observacao: string | null;
};

export type UltimaNomeacao = {
  nomeacao_id: string;
  data_nomeacao: string | null;
  quantidade: number | null;
  dou_link: string | null;
  created_at: string | null;
  candidate_id: string | null;
  nome_candidato: string | null;
  sistema_concorrencia: string | null;
  classificacao_lista: number | null;
  ordem_nomeacao_base: number | null;
};

export type UltimoTD = {
  td_request_id: string;
  data_aprovacao: string | null;
  tipo_td: string | null;
  observacao: string | null;
  candidate_id: string | null;
  nome_candidato: string | null;
  sistema_concorrencia: string | null;
  classificacao_lista: number | null;
  ordem_nomeacao_base: number | null;
};

export type Vacancia = {
  id: string;
  data: string | null;
  nome_servidor: string | null;
  motivo: string | null;
  tipo: string | null;
  dou_link: string | null;
  created_at: string | null;
};

export type Notificacao = {
  id: string;
  titulo: string;
  corpo: string;
  tipo: string | null;
  visivel_para: string | null;
  created_at: string;
};

export type CandidateResumoData = {
  candidate: {
    id: string;
    nome: string;
    sistema_concorrencia: string;
    classificacao_lista: number;
    ordem_nomeacao_base: number;
    status_nomeacao: string | null;
    td_status: string | null;
    td_observacao: string | null;
  };
  posicoes: ResumoPosicoes;
  concursoResumo: ConcursoResumo;
  painelAtual: PainelAtual | null;
  ultimasNomeacoes: UltimaNomeacao[];
  ultimosTDs: UltimoTD[];
  ultimasVacancias: Vacancia[];
  ultimasNotificacoes: Notificacao[];
  outrasAprovacoesCount: number;
};

export async function loadResumoData(
  candidateId: string,
): Promise<CandidateResumoData> {
  const supabase = await createSupabaseServerClient();

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select(
      "id, nome, sistema_concorrencia, classificacao_lista, ordem_nomeacao_base, status_nomeacao, td_status, td_observacao",
    )
    .eq("id", candidateId)
    .single();

  if (candidateError || !candidate) {
    console.error(candidateError);
    throw new Error("Não foi possível carregar os dados do candidato.");
  }

  const { data: resumoFunc, error: resumoError } = await supabase.rpc(
    "get_candidate_resumo",
    { p_candidate_id: candidateId },
  );

  if (resumoError) {
    console.error(resumoError);
    throw new Error("Erro ao calcular posições do candidato.");
  }

  const posRaw = (resumoFunc && resumoFunc[0]) || {
    candidatos_na_frente_ordem: 0,
    posicao_efetiva_ordem: candidate.ordem_nomeacao_base,
    candidatos_na_frente_lista: 0,
    posicao_efetiva_lista: candidate.classificacao_lista,
  };

  const posicoes: ResumoPosicoes = {
    candidatosNaFrenteOrdem: posRaw.candidatos_na_frente_ordem ?? 0,
    posicaoEfetivaOrdem: posRaw.posicao_efetiva_ordem ?? candidate.ordem_nomeacao_base,
    candidatosNaFrenteLista: posRaw.candidatos_na_frente_lista ?? 0,
    posicaoEfetivaLista: posRaw.posicao_efetiva_lista ?? candidate.classificacao_lista,
  };

  const { data: resumoConcurso, error: resumoConcursoError } = await supabase
    .from("candidates_resumo_view")
    .select("*")
    .single();

  if (resumoConcursoError || !resumoConcurso) {
    console.error(resumoConcursoError);
    throw new Error("Erro ao carregar resumo geral do concurso.");
  }

  const concursoResumo: ConcursoResumo = {
    totalAprovados: resumoConcurso.total_aprovados ?? 0,
    totalAprovadosAmpla: resumoConcurso.total_aprovados_ampla ?? 0,
    totalAprovadosPcd: resumoConcurso.total_aprovados_pcd ?? 0,
    totalAprovadosPpp: resumoConcurso.total_aprovados_ppp ?? 0,
    totalAprovadosIndigena: resumoConcurso.total_aprovados_indigena ?? 0,
    totalNomeados: resumoConcurso.total_nomeados ?? 0,
    totalNomeadosAmpla: resumoConcurso.total_nomeados_ampla ?? 0,
    totalNomeadosPcd: resumoConcurso.total_nomeados_pcd ?? 0,
    totalNomeadosPpp: resumoConcurso.total_nomeados_ppp ?? 0,
    totalNomeadosIndigena: resumoConcurso.total_nomeados_indigena ?? 0,
  };

  const { data: painelAtualData, error: painelError } = await supabase
    .from("painel_atualizacoes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (painelError) {
    console.error(painelError);
  }

  const painelAtual: PainelAtual | null = painelAtualData
    ? {
        id: painelAtualData.id,
        ano: painelAtualData.ano,
        mes: painelAtualData.mes,
        vagas_loa_jt: painelAtualData.vagas_loa_jt,
        vagas_autorizadas_jt: painelAtualData.vagas_autorizadas_jt,
        vagas_autorizadas_trt2: painelAtualData.vagas_autorizadas_trt2,
        vagas_autorizadas_trt2_tjaa: painelAtualData.vagas_autorizadas_trt2_tjaa,
        vagas_pendentes_csjt: painelAtualData.vagas_pendentes_csjt,
        cargos_vagos_trt2_total: painelAtualData.cargos_vagos_trt2_total,
        cargos_vagos_trt2_onerosos: painelAtualData.cargos_vagos_trt2_onerosos,
        cargos_vagos_trt2_nao_onerosos: painelAtualData.cargos_vagos_trt2_nao_onerosos,
        observacao: painelAtualData.observacao,
      }
    : null;

  const { data: ultimasNomeacoes = [], error: ultimasNomeacoesError } =
    await supabase
      .from("ultimas_nomeacoes_view")
      .select("*")
      .order("data_nomeacao", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

  if (ultimasNomeacoesError) {
    console.error(ultimasNomeacoesError);
  }

  const { data: ultimosTDs = [], error: ultimosTDsError } = await supabase
    .from("ultimos_tds_view")
    .select("*")
    .order("data_aprovacao", { ascending: false })
    .limit(10);

  if (ultimosTDsError) {
    console.error(ultimosTDsError);
  }

  const { data: ultimasVacancias = [], error: ultimasVacanciasError } =
    await supabase
      .from("ultimas_vacancias_view")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

  if (ultimasVacanciasError) {
    console.error(ultimasVacanciasError);
  }

  const { data: ultimasNotificacoes = [], error: ultimasNotificacoesError } =
    await supabase
      .from("ultimas_notificacoes_view")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

  if (ultimasNotificacoesError) {
    console.error(ultimasNotificacoesError);
  }

  const {
    count: outrasAprovacoesCount = 0,
    error: outrasAprovacoesError,
  } = await supabase
    .from("outras_aprovacoes")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidateId);

  if (outrasAprovacoesError) {
    console.error(outrasAprovacoesError);
  }

  return {
    candidate: {
      id: candidate.id,
      nome: candidate.nome,
      sistema_concorrencia: candidate.sistema_concorrencia,
      classificacao_lista: candidate.classificacao_lista,
      ordem_nomeacao_base: candidate.ordem_nomeacao_base,
      status_nomeacao: candidate.status_nomeacao,
      td_status: candidate.td_status,
      td_observacao: candidate.td_observacao,
    },
    posicoes,
    concursoResumo,
    painelAtual,
    ultimasNomeacoes,
    ultimosTDs,
    ultimasVacancias,
    ultimasNotificacoes,
    outrasAprovacoesCount,
  };
}
