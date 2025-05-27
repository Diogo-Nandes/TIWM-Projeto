import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, StyleSheet, Text, TextInput, View, FlatList, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
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
  const [horarios, setHorarios] = useState<string[]>([]);
  const [showDe, setShowDe] = useState(false);
  const [showAte, setShowAte] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchMedicamento = async () => {
      try {
        const user = auth().currentUser;
        if (!user) {
          Alert.alert('Erro', 'Utilizador não autenticado.');
          setLoading(false);
          return;
        }

        const doc = await firestore().collection('Medicamentos').doc(id).get();
        if (doc.exists()) {
          const data = doc.data();
          if (data?.uid !== user.uid) {
            Alert.alert('Acesso negado', 'Não tens permissão para editar este medicamento.');
            router.back();
            return;
          }
          setNome(data?.Nome_Med || '');
          setQuantidade(data?.Quantidade_mg?.toString() || '');
          setDe(data?.De?.toDate ? data.De.toDate() : null);
          setAte(data?.Até?.toDate ? data.Até.toDate() : null);
          setHorarios(Array.isArray(data?.Horarios) ? data.Horarios : []);
        } else {
          Alert.alert('Erro', 'Medicamento não encontrado.');
          router.back();
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar o medicamento.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMedicamento();
  }, [id]);

  const adicionarHorario = (time: Date) => {
    const novoHorario = time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    setHorarios([...horarios, novoHorario]);
  };

  const removerHorario = (index: number) => {
    const novosHorarios = horarios.filter((_, i) => i !== index);
    setHorarios(novosHorarios);
  };

  const atualizarMedicamento = async () => {
    if (!nome.trim() || !quantidade.trim() || !de || !ate || horarios.length === 0) {
      Alert.alert('Preenche todos os campos e adiciona pelo menos um horário!');
      return;
    }
    setLoading(true);
    try {
      await firestore().collection('Medicamentos').doc(id).update({
        Nome_Med: nome,
        Quantidade_mg: Number(quantidade),
        De: firestore.Timestamp.fromDate(de),
        Até: firestore.Timestamp.fromDate(ate),
        Horarios: horarios,
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
  	  <View style={{ height: 250 }}>
        <Text style={styles.label}>Horários de toma:</Text>
        <FlatList
          data={horarios}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.horarioItem}>
              <Text style={styles.horarioText}>{item}</Text>
              <TouchableOpacity onPress={() => removerHorario(index)}>
                <Text style={styles.remover}>Remover</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum horário adicionado.</Text>}
        />
      </View>
        <Button
          title="ADICIONAR HORÁRIO"
          onPress={() => setShowTimePicker(true)}
        />
        {showTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) adicionarHorario(selectedTime);
            }}
          />
        )}

      <View style={styles.gap12} />

      <Button
        title="GUARDAR ALTERAÇÕES"
        color="#2196F3"
        onPress={atualizarMedicamento}
      />
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
  horarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    padding: 8,
    justifyContent: 'space-between',
  },
  horarioText: {
    fontSize: 16,
    color: '#1565c0',
  },
  remover: {
    color: '#F44336',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  empty: { color: '#888', fontStyle: 'italic', marginBottom: 6 },
  gap12: { height: 12 },
});
