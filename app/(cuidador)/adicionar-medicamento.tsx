import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator, Image, Platform, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import BackButton from '../../components/BackButton';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function AdicionarMedicamentoScreen() {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [de, setDe] = useState<Date | null>(null);
  const [ate, setAte] = useState<Date | null>(null);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [showDe, setShowDe] = useState(false);
  const [showAte, setShowAte] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (medicamentoId: string) => {
    if (!image) return null;
    const reference = storage().ref(`medicamentos/${medicamentoId}`);
    const response = await fetch(image);
    const blob = await response.blob();
    await reference.put(blob);
    return await reference.getDownloadURL();
  };

  const adicionarHorario = (time: Date) => {
    const novoHorario = time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    setHorarios([...horarios, novoHorario]);
  };

  const removerHorario = (index: number) => {
    const novosHorarios = horarios.filter((_, i) => i !== index);
    setHorarios(novosHorarios);
  };

  const adicionarMedicamento = async () => {
    if (!nome.trim() || !quantidade.trim() || !de || !ate || horarios.length === 0) {
      Alert.alert('Preenche todos os campos e adiciona pelo menos um horário!');
      return;
    }
    // Validação de datas
    if (de && ate && ate <= de) {
      Alert.alert('A data de fim deve ser superior à data de início.');
      return;
    }
    setLoading(true);
    try {
      const docRef = await firestore().collection('Medicamentos').add({
        Nome_Med: nome,
        Quantidade_mg: Number(quantidade),
        De: firestore.Timestamp.fromDate(de),
        Até: firestore.Timestamp.fromDate(ate),
        Horarios: horarios,
        uid: auth().currentUser?.uid,
        imagemUrl: '',
        createdAt: firestore.FieldValue.serverTimestamp()
      });
      let imagemUrl = '';
      if (image) {
        const url = await uploadImage(docRef.id);
        if (url) {
          imagemUrl = url;
          await docRef.update({ imagemUrl: url });
        }
      }
      Alert.alert('Medicamento adicionado com sucesso!');
      setNome('');
      setQuantidade('');
      setDe(null);
      setAte(null);
      setHorarios([]);
      setImage(null);
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome do medicamento:</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome do medicamento"
          value={nome}
          onChangeText={setNome}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Dosagem:</Text>
        <TextInput
          style={styles.input}
          placeholder="Quantidade (mg)"
          value={quantidade}
          onChangeText={setQuantidade}
          keyboardType="numeric"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>De:</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowDe(true)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {de ? de.toLocaleDateString() : "Selecionar data de início"}
          </Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          style={styles.button1}
          onPress={() => setShowAte(true)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText1}>
            {ate ? ate.toLocaleDateString() : "Selecionar data de fim"}
          </Text>
        </TouchableOpacity>
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

        <Text style={styles.label}>Horários de toma:</Text>
        <View>
          {horarios.length === 0 ? (
            <Text style={styles.empty}>Nenhum horário adicionado.</Text>
          ) : (
            horarios.map((hora, idx) => (
              <View key={idx} style={styles.horarioItem}>
                <Text style={styles.horarioText}>{hora}</Text>
                <TouchableOpacity onPress={() => removerHorario(idx)}>
                  <Text style={styles.remover}>Remover</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowTimePicker(true)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Adicionar horário</Text>
        </TouchableOpacity>
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

        {/* Placeholder de imagem quadrado no fundo da página */}
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.imagePlaceholder}
            onPress={pickImage}
            accessibilityRole="imagebutton"
            accessibilityLabel="Adicionar imagem"
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <View style={styles.placeholderContent}>
                <Ionicons name="add-circle-outline" size={56} color="#bbb" />
                <Text style={styles.placeholderText}>Adicionar imagem</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.gap12} />
        {loading ? (
          <ActivityIndicator size="large" color="#2196F3" />
        ) : (
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={adicionarMedicamento}
            accessibilityRole="button"
          >
            <Text style={styles.buttonTextPrimary}>Adicionar Medicamento</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  scrollContent: { paddingBottom: 40 },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#2196F3",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 22,
    backgroundColor: '#f9f9f9',
    minHeight: 56,
  },
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontWeight: 'bold',
    color: '#2196F3',
    fontSize: 20,
  },
  button: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#1565c0',
    fontSize: 22,
    fontWeight: 'bold',
  },
  // Botão Até
  button1: {
    backgroundColor: '#1565c0',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonText1: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 18,
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  horarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between',
  },
  horarioText: {
    fontSize: 22,
    color: '#1565c0',
  },
  remover: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 20,
  },
  empty: { color: '#888', fontStyle: 'italic', marginBottom: 10, fontSize: 18 },
  gap12: { height: 18 },
  imageSection: { alignItems: 'center', marginTop: 30, marginBottom: 8 },
  imagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#bbb',
    marginBottom: 8,
  },
  placeholderContent: { 
    flex: 1, 
    width: '100%', 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  placeholderText: { 
    color: '#888', 
    fontSize: 20, 
    marginTop: 8, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 16,
    resizeMode: 'cover',
  },
});


