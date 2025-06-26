import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackButton from '../../components/BackButton';

type Medicamento = {
  id: string;
  Nome_Med: string;
  De?: FirebaseFirestoreTypes.Timestamp;
  Até?: FirebaseFirestoreTypes.Timestamp;
  Horarios?: string[];
};

type HorarioGrupo = {
  hora: string;
  medicamentos: Medicamento[];
};

type RegistoToma = {
  medicamentoId: string;
  horario: string;
  data: FirebaseFirestoreTypes.Timestamp;
  validado: boolean;
};

export default function ValidarTomaScreen() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [registos, setRegistos] = useState<RegistoToma[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Procurar medicamentos
    const unsubscribeMeds = firestore()
      .collection('Medicamentos')
      .where('uid', '==', user.uid)
      .onSnapshot(
        (querySnapshot) => {
          try {
            const meds: Medicamento[] = [];
            if (querySnapshot && querySnapshot.docs && Array.isArray(querySnapshot.docs)) {
              querySnapshot.docs.forEach(documentSnapshot => {
                try {
                  if (documentSnapshot && documentSnapshot.exists() && documentSnapshot.data) {
                    const data = documentSnapshot.data() as any;
                    const medicamento: Medicamento = {
                      id: documentSnapshot.id,
                      Nome_Med: data.Nome_Med || '',
                      De: data.De || null,
                      Até: data.Até || null,
                      Horarios: Array.isArray(data.Horarios) ? data.Horarios : [],
                    };
                    meds.push(medicamento);
                  }
                } catch (docError) {
                  console.log('Erro ao processar documento:', docError);
                }
              });
            }
            setMedicamentos(meds);
            setLoading(false);
          } catch (error) {
            console.log('Erro no snapshot de medicamentos:', error);
            setLoading(false);
          }
        },
        (error) => {
          console.log('Erro na subscrição de medicamentos:', error);
          setLoading(false);
        }
      );

    // Procurar registos de tomas validadas de hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const unsubscribeRegistos = firestore()
      .collection('RegistosTomas')
      .where('data', '>=', firestore.Timestamp.fromDate(hoje))
      .where('data', '<', firestore.Timestamp.fromDate(amanha))
      .where('validado', '==', true)
      .onSnapshot(
        (querySnapshot) => {
          try {
            const regs: RegistoToma[] = [];
            if (querySnapshot && querySnapshot.docs && Array.isArray(querySnapshot.docs)) {
              querySnapshot.docs.forEach(documentSnapshot => {
                try {
                  if (documentSnapshot && documentSnapshot.exists() && documentSnapshot.data) {
                    const data = documentSnapshot.data() as RegistoToma;
                    if (data.medicamentoId && data.horario) {
                      regs.push(data);
                    }
                  }
                } catch (docError) {
                  console.log('Erro ao processar registo:', docError);
                }
              });
            }
            setRegistos(regs);
          } catch (error) {
            console.log('Erro no snapshot de registos:', error);
          }
        },
        (error) => {
          console.log('Erro na subscrição de registos:', error);
        }
      );

    return () => {
      try {
        unsubscribeMeds();
        unsubscribeRegistos();
      } catch (error) {
        console.log('Erro ao cancelar subscrições:', error);
      }
    };
  }, []);

  function getHorariosAtuaisAgrupados(): HorarioGrupo[] {
    try {
      const agora = new Date();
      const grupos: { [hora: string]: Medicamento[] } = {};

      if (!Array.isArray(medicamentos)) {
        return [];
      }

      medicamentos.forEach(med => {
        try {
          if (!med || !med.id || !med.Nome_Med) return;

          const deDate = (med.De && typeof med.De.toDate === 'function') ? med.De.toDate() : null;
          const ateDate = (med.Até && typeof med.Até.toDate === 'function') ? med.Até.toDate() : null;
          const horarios = Array.isArray(med.Horarios) ? med.Horarios : [];

          if (!deDate || !ateDate || agora < deDate || agora > ateDate) return;

          horarios.forEach(horario => {
            try {
              if (!horario || typeof horario !== 'string') return;

              const horarioParts = horario.split(':');
              if (horarioParts.length !== 2) return;

              const [hora, minuto] = horarioParts.map(Number);
              if (isNaN(hora) || isNaN(minuto)) return;

              const horarioMed = new Date(agora);
              horarioMed.setHours(hora, minuto, 0, 0);

              const inicioJanela = new Date(horarioMed.getTime() - 300000); // 5 min antes
              const fimJanela = new Date(horarioMed.getTime() + 3600000);   // 1 hora depois

              const dentroJanela = agora >= inicioJanela && agora < fimJanela;

              // Verifica se já existe registo validado
              const jaValidado = Array.isArray(registos) && registos.some(reg =>
                reg && reg.medicamentoId === med.id && reg.horario === horario
              );

              if (dentroJanela && !jaValidado) {
                if (!grupos[horario]) grupos[horario] = [];
                grupos[horario].push(med);
              }
            } catch (horarioError) {
              console.log('Erro ao processar horário:', horarioError);
            }
          });
        } catch (medError) {
          console.log('Erro ao processar medicamento:', medError);
        }
      });

      return Object.entries(grupos)
        .sort(([a], [b]) => {
          const [aH, aM] = a.split(':').map(Number);
          const [bH, bM] = b.split(':').map(Number);
          return aH - bH || aM - bM;
        })
        .map(([hora, medicamentos]) => ({ hora, medicamentos }));
    } catch (error) {
      console.log('Erro em getHorariosAtuaisAgrupados:', error);
      return [];
    }
  }

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  const grupos = getHorariosAtuaisAgrupados();

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Medicamentos para Validar</Text>
      <FlatList
        data={grupos}
        keyExtractor={item => item.hora}
        renderItem={({ item }) => (
          <View style={styles.horarioGroup}>
            <Text style={styles.horaHeader}>{item.hora}</Text>
            {Array.isArray(item.medicamentos) && item.medicamentos.map((med, index) => (
              <TouchableOpacity
                key={`${med.id}-${item.hora}-${index}`}
                style={styles.medicamentoItem}
                onPress={() => router.push(`/validar-toma-medicamento?id=${med.id}&horario=${item.hora}`)}
              >
                <Text style={styles.medicamentoNome}>{med.Nome_Med}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum medicamento para validar neste momento.</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  title: { fontSize: 38, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 20, marginTop: 40, },
  horarioGroup: {
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },
  horaHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e3e3e3',
    paddingBottom: 8,
    textAlign: 'left',
  },
  medicamentoItem: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  medicamentoNome: {
    fontSize: 22,
    color: '#2196F3',
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
    fontSize: 20,
    paddingHorizontal: 20,
  },
});