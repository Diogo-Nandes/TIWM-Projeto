import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '../../components/BackButton';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditarMedicamentoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [de, setDe] = useState<Date | null>(null);
  const [ate, setAte] = useState<Date | null>(null);
  const [showDe, setShowDe] = useState(false);
  const [showAte, setShowAte] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchMedicamento = async () => {
      try {
        const doc = await firestore().collection('Medicamentos').doc(id).get();
        if (doc.exists()) {
          const data = doc.data();
          setNome(data?.Nome_Med || '');
          setQuantidade(data?.Quantidade_mg?.toString() || '');
          setDe(data?.De?.toDate ? data.De.toDate() : null);
          setAte(data?.Até?.toDate ? data.Até.toDate() : null);
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar o medicamento.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMedicamento();
  }, [id]);

  const atualizarMedicamento = async () => {
    if (!nome.trim() || !quantidade.trim() || !de || !ate) {
      Alert.alert('Preenche todos os campos!');
      return;
    }
    setLoading(true);
    try {
      await firestore().collection('Medicamentos').doc(id).update({
        Nome_Med: nome,
        Quantidade_mg: Number(quantidade),
        De: firestore.Timestamp.fromDate(de),
        Até: firestore.Timestamp.fromDate(ate),
      });
      Alert.alert('Medicamento atualizado com sucesso!');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o medicamento.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Editar Medicamento</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do medicamento"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Quantidade (mg)"
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="numeric"
      />

      {/* Data de início */}
      <Text style={styles.label}>De:</Text>
      <Button
        title={de ? de.toLocaleDateString() : "Selecionar data de início"}
        onPress={() => setShowDe(true)}
      />
      {showDe && (
        <DateTimePicker
          value={de || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setShowDe(false);
            if (selectedDate) setDe(selectedDate);
          }}
        />
      )}

      {/* Data de fim */}
      <Text style={styles.label}>Até:</Text>
      <Button
        title={ate ? ate.toLocaleDateString() : "Selecionar data de fim"}
        onPress={() => setShowAte(true)}
      />
      {showAte && (
        <DateTimePicker
          value={ate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setShowAte(false);
            if (selectedDate) setAte(selectedDate);
          }}
        />
      )}

      {/* Gap para o botão */}
      <View style={styles.gap} />

      <Button title="Guardar Alterações" onPress={atualizarMedicamento} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 10, marginTop: 40 },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  gap: { height: 12 },
});
