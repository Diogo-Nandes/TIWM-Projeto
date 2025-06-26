import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '../../components/BackButton';

export default function ValidarTomaMedicamentoScreen() {
  const { id, horario } = useLocalSearchParams<{ id: string, horario: string }>();
  const [medicamento, setMedicamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    const subscriber = firestore()
      .collection('Medicamentos')
      .doc(id)
      .onSnapshot(documentSnapshot => {
        if (documentSnapshot.exists()) {
          setMedicamento(documentSnapshot.data());
        }
        setLoading(false);
      });

    return () => subscriber();
  }, [id]);

  const validarToma = async () => {
    if (!id || !horario) {
      Alert.alert('Erro', 'Informação em falta para validar a toma.');
      return;
    }
    try {
      await firestore().collection('RegistosTomas').add({
        medicamentoId: id,
        horario: horario,
        data: firestore.FieldValue.serverTimestamp(),
        validado: true
      });
      Alert.alert('Sucesso', 'Toma validada com sucesso!');
      router.replace('/validar-toma');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível validar a toma.');
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <BackButton />

      <Text style={styles.title}>{medicamento?.Nome_Med}</Text>
      <Text style={styles.detail}>Dosagem: {medicamento?.Quantidade_mg} mg</Text>
      <Text style={styles.detail}>Horário: {horario}</Text>
        
      <TouchableOpacity style={styles.button} onPress={validarToma}>
        <Text style={styles.buttonText}>Confirmar Toma</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  detail: {
    fontSize: 28,
    color: '#1565c0',
    marginBottom: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginTop: 36,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
