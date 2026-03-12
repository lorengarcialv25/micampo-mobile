import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dypai } from '../lib/dypai';
import { useAuth } from './AuthContext';

const CampaignContext = createContext();

export const useCampaign = () => useContext(CampaignContext);

export const CampaignProvider = ({ children }) => {
  const [currentCampaign, setCurrentCampaign] = useState('');
  const [currentCampaignId, setCurrentCampaignId] = useState(null);
  const [campaignList, setCampaignList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isChangingCampaign, setIsChangingCampaign] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Cargar campaña guardada localmente al iniciar
  useEffect(() => {
    const loadSavedCampaign = async () => {
      try {
        const savedId = await AsyncStorage.getItem('last_campaign_id');
        const savedName = await AsyncStorage.getItem('last_campaign_name');
        if (savedId && savedName) {
          setCurrentCampaignId(savedId);
          setCurrentCampaign(savedName);
        }
      } catch (error) {
        console.error('Error cargando campaña de AsyncStorage:', error);
      }
    };
    loadSavedCampaign();
  }, []);

  const loadCampaigns = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Obtener todas las campañas del usuario
      const { data: campaignsData, error } = await dypai.api.get('obtener_campaigns', {
        params: {
          sort_by: 'created_at',
          order: 'DESC',
          limit: 50
        }
      });

      if (error) {
        console.error('Error obteniendo campañas:', error);
        return;
      }

      let campaigns = campaignsData || [];

      // 1. Intentar usar la campaña guardada en AsyncStorage si existe en la lista
      const savedId = await AsyncStorage.getItem('last_campaign_id');
      const savedCampaign = campaigns.find(c => c.id === savedId);

      // 2. Si no hay guardada, buscar la campaña activa en la API
      const activeCampaign = campaigns.find(c => c.is_active === true);
      
      if (savedCampaign) {
        setCurrentCampaign(savedCampaign.name);
        setCurrentCampaignId(savedCampaign.id);
      } else if (activeCampaign) {
        setCurrentCampaign(activeCampaign.name);
        setCurrentCampaignId(activeCampaign.id);
        // Guardar como última campaña vista
        await AsyncStorage.setItem('last_campaign_id', activeCampaign.id);
        await AsyncStorage.setItem('last_campaign_name', activeCampaign.name);
      } else if (campaigns.length > 0) {
        // Si hay campañas pero ninguna activa ni guardada, usar la primera
        const firstCampaign = campaigns[0];
        setCurrentCampaign(firstCampaign.name);
        setCurrentCampaignId(firstCampaign.id);
        await AsyncStorage.setItem('last_campaign_id', firstCampaign.id);
        await AsyncStorage.setItem('last_campaign_name', firstCampaign.name);
      } else {
        // No hay campañas, crear una por defecto basada en la fecha actual
        const date = new Date();
        const month = date.getMonth();
        const year = date.getFullYear();
        const shortYear = year.toString().slice(-2);
        const nextShortYear = (year + 1).toString().slice(-2);
        const prevShortYear = (year - 1).toString().slice(-2);

        let campaignName;
        let startDate, endDate;

        if (month >= 8) {
          // Sept-Dic: campaña actual-siguiente (ej: 24-25)
          campaignName = `${shortYear}-${nextShortYear}`;
          startDate = `${year}-09-01`;
          endDate = `${year + 1}-08-31`;
        } else {
          // Ene-Agosto: campaña anterior-actual (ej: 23-24)
          campaignName = `${prevShortYear}-${shortYear}`;
          startDate = `${year - 1}-09-01`;
          endDate = `${year}-08-31`;
        }

        try {
          const { data: newCampaignData, error: createError } = await dypai.api.post('crear_campaign', {
            name: campaignName,
            start_date: startDate,
            end_date: endDate,
            is_active: true
          });

          if (createError) throw createError;

          const created = Array.isArray(newCampaignData) ? newCampaignData[0] : newCampaignData;
          if (created?.id) {
            const fullCampaignName = `Campaña ${campaignName}`;
            setCurrentCampaign(fullCampaignName);
            setCurrentCampaignId(created.id);
            campaigns = [{ id: created.id, name: fullCampaignName, is_active: true, start_date: startDate, end_date: endDate }];
            // Guardar en AsyncStorage
            await AsyncStorage.setItem('last_campaign_id', created.id);
            await AsyncStorage.setItem('last_campaign_name', fullCampaignName);
          }
        } catch (error) {
          console.error('Error creando campaña por defecto:', error);
          // Fallback a cálculo local
          setCurrentCampaign(`Campaña ${campaignName}`);
        }
      }

      setCampaignList(campaigns.map(c => ({
        id: c.id,
        name: c.name,
        active: c.is_active === true,
        start_date: c.start_date,
        end_date: c.end_date
      })));

    } catch (error) {
      console.error('Error cargando campañas:', error);
      // Fallback a cálculo local si falla la API
      if (!currentCampaignId) {
        const date = new Date();
        const month = date.getMonth();
        const year = date.getFullYear();
        const shortYear = year.toString().slice(-2);
        const nextShortYear = (year + 1).toString().slice(-2);
        const prevShortYear = (year - 1).toString().slice(-2);

        let calculatedCampaign;
        if (month >= 8) {
          calculatedCampaign = `Campaña ${shortYear}-${nextShortYear}`;
        } else {
          calculatedCampaign = `Campaña ${prevShortYear}-${shortYear}`;
        }

        setCurrentCampaign(calculatedCampaign);
        setCampaignList([
          { id: '1', name: calculatedCampaign, active: true },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar campañas desde la API
  useEffect(() => {
    loadCampaigns();
  }, [isAuthenticated, user]);

  const changeCampaign = async (campaignId, campaignName) => {
    try {
      setIsChangingCampaign(true);
      
      // Actualizar AsyncStorage inmediatamente para UX instantánea
      setCurrentCampaign(campaignName);
      setCurrentCampaignId(campaignId);
      await AsyncStorage.setItem('last_campaign_id', campaignId);
      await AsyncStorage.setItem('last_campaign_name', campaignName);

      // Desactivar todas las campañas primero
      const campaignsToUpdate = campaignList.filter(c => c.active);
      for (const camp of campaignsToUpdate) {
        const { error: deactivateError } = await dypai.api.put('actualizar_campaign', {
          id: camp.id,
          is_active: false
        });
        if (deactivateError) {
          console.error(`Error desactivando campaña ${camp.id}:`, deactivateError);
        }
      }

      // Activar la campaña seleccionada
      const { error: activateError } = await dypai.api.put('actualizar_campaign', {
        id: campaignId,
        is_active: true
      });
      if (activateError) throw activateError;

      // Actualizar estado local
      setCampaignList(prev => prev.map(c => ({
        ...c,
        active: c.id === campaignId
      })));

    } catch (error) {
      console.error('Error cambiando campaña:', error);
    } finally {
      setIsChangingCampaign(false);
    }
  };

  const createCampaign = async (name, startDate, endDate, isActive = false) => {
    try {
      const { data: newCampaignData, error } = await dypai.api.post('crear_campaign', {
        name,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive
      });

      if (error) throw error;

      const newCampaign = Array.isArray(newCampaignData) ? newCampaignData[0] : newCampaignData;
      if (newCampaign?.id) {
        const campaign = {
          id: newCampaign.id,
          name: name,
          active: isActive,
          start_date: startDate,
          end_date: endDate
        };
        
        if (isActive) {
          setCurrentCampaign(name);
          setCurrentCampaignId(newCampaign.id);
          await AsyncStorage.setItem('last_campaign_id', newCampaign.id);
          await AsyncStorage.setItem('last_campaign_name', name);
          setCampaignList(prev => prev.map(c => ({ ...c, active: false })).concat(campaign));
        } else {
          setCampaignList(prev => [...prev, campaign]);
        }
        
        return campaign;
      }
    } catch (error) {
      console.error('Error creando campaña:', error);
      throw error;
    }
  };

  const updateCampaign = async (campaignId, updates) => {
    try {
      const apiUpdates = { id: campaignId };
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.start_date !== undefined) apiUpdates.start_date = updates.start_date || null;
      if (updates.end_date !== undefined) apiUpdates.end_date = updates.end_date || null;
      if (updates.active !== undefined) apiUpdates.is_active = updates.active;

      const { error } = await dypai.api.put('actualizar_campaign', apiUpdates);
      if (error) throw error;

      if (updates.name && campaignId === currentCampaignId) {
        setCurrentCampaign(updates.name);
        await AsyncStorage.setItem('last_campaign_name', updates.name);
      }

      setCampaignList(prev => prev.map(c => 
        c.id === campaignId ? { ...c, ...updates } : c
      ));
    } catch (error) {
      console.error('Error actualizando campaña:', error);
      throw error;
    }
  };

  const deleteCampaign = async (campaignId) => {
    try {
      const { error } = await dypai.api.delete('eliminar_campaign', { params: { id: campaignId } });
      if (error) throw error;

      if (campaignId === currentCampaignId) {
        const other = campaignList.find(c => c.id !== campaignId);
        if (other) {
          setCurrentCampaignId(other.id);
          setCurrentCampaign(other.name);
          await AsyncStorage.setItem('last_campaign_id', other.id);
          await AsyncStorage.setItem('last_campaign_name', other.name);
        } else {
          setCurrentCampaignId(null);
          setCurrentCampaign('');
          await AsyncStorage.removeItem('last_campaign_id');
          await AsyncStorage.removeItem('last_campaign_name');
        }
      }

      setCampaignList(prev => prev.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Error eliminando campaña:', error);
      throw error;
    }
  };

  return (
    <CampaignContext.Provider value={{ 
      currentCampaign, 
      currentCampaignId,
      campaignList, 
      changeCampaign,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      loading,
      isChangingCampaign,
      refreshCampaigns: loadCampaigns
    }}>
      {children}
    </CampaignContext.Provider>
  );
};

