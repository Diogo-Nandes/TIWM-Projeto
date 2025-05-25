import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View, ActivityIndicator, Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import BackButton from '../../components/BackButton';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AdicionarMedicamentoScreen() {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [de, setDe] = useState<Date | null>(null);
  const [ate, setAte] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // Para DatePicker
  const [showDe, setShowDe] = useState(false);
  const [showAte, setShowAte] = useState(false);

  const adicionarMedicamento = async () => {
    if (!nome.trim() || !quantidade.trim() || !de || !ate) {
      Alert.alert('Preenche todos os campos!');
      return;
    }
    setLoading(true);
    try {
      await firestore().collection('Medicamentos').add({
        Nome_Med: nome,
        Quantidade_mg: Number(quantidade),
        De: firestore.Timestamp.fromDate(de),
        Até: firestore.Timestamp.fromDate(ate),
      });
      Alert.alert('Medicamento adicionado com sucesso!');
      setNome('');
      setQuantidade('');
      setDe(null);
      setAte(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o medicamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Adicionar Medicamento</Text>
      <View style={styles.form}>
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

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <Button title="Adicionar" onPress={adicionarMedicamento} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 10, marginTop: 40 },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});
