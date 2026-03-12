import { useState, useMemo } from 'react';

const useWorkersFilters = (jornales) => {
  // Estados de Filtro
  const [dateFrom, setDateFrom] = useState(new Date(2025, 0, 1));
  const [dateTo, setDateTo] = useState(new Date());
  const [selectedWorker, setSelectedWorker] = useState("Todos");
  const [selectedParcela, setSelectedParcela] = useState("Todas");

  // workerOptions y parcelaOptions ahora vienen como props, pero mantenemos compatibilidad
  const workerOptionsFromJornales = useMemo(() => {
    const names = Array.from(new Set(jornales.map((j) => j.worker)));
    return ["Todos", ...names];
  }, [jornales]);

  const parcelaOptionsFromJornales = useMemo(() => {
    const parcelas = Array.from(new Set(jornales.map((j) => j.parcela)));
    return ["Todas", ...parcelas];
  }, [jornales]);

  const filteredJornales = useMemo(() => {
    return jornales.filter((j) => {
      const matchWorker = selectedWorker === "Todos" || j.worker === selectedWorker;
      const matchParcela = selectedParcela === "Todas" || j.parcela === selectedParcela;
      
      // Parse date from string (YYYY-MM-DD)
      const jDate = new Date(j.date);
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      jDate.setHours(0, 0, 0, 0);
      
      const matchDate = jDate >= fromDate && jDate <= toDate;
      
      return matchWorker && matchParcela && matchDate;
    });
  }, [jornales, selectedWorker, selectedParcela, dateFrom, dateTo]);

  const resetFilters = () => {
    setDateFrom(new Date(2025, 0, 1));
    setDateTo(new Date());
    setSelectedWorker("Todos");
    setSelectedParcela("Todas");
  };

  return {
    // Estados
    dateFrom,
    dateTo,
    selectedWorker,
    selectedParcela,
    // Setters
    setDateFrom,
    setDateTo,
    setSelectedWorker,
    setSelectedParcela,
    // Opciones y filtros
    workerOptions: workerOptionsFromJornales,
    parcelaOptions: parcelaOptionsFromJornales,
    filteredJornales,
    // Utilidades
    resetFilters,
  };
};

export default useWorkersFilters;
