import React, { Component, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, FlatList, TextInput, Modal, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const App = () => {
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isMenuEnabled, setIsMenuEnabled] = useState(false);
    const [isRenameOverlayEnabled, setIsRenameOverlayEnabled] = useState(false);
    const [currentNote, setCurrentNote] = useState(0);
    const [notes, setNotes] = useState<{name : string, content : string, id : number, selected : boolean}[]>([]);
    //Force react to re-render the FlatList
    const updateNotes = (notes : {name : string, content : string, id : number, selected : boolean}[]) => {
        setNotes([...notes]);
    }
    if (isFirstLoad){getNotes(setNotes); setIsFirstLoad(false)}
    return <View style = {styles.container}>
        {isRenameOverlayEnabled ? <RenameOverlay setIsEnabled={setIsRenameOverlayEnabled} notes = {notes} setNotes = {setNotes} currentNoteIndex = {currentNote}/> : null}
        {isMenuEnabled ? <Menu notes={notes} setNotes={updateNotes} currentNote = {currentNote} setCurrentNote = {setCurrentNote}/> : null}
        <NoteView toggleMenu={setIsMenuEnabled} menuEnabled={isMenuEnabled} currentNote = {currentNote} notes = {notes} setNotes = {setNotes} setCurrentNote = {setCurrentNote} setIsRenameOverlayEnabled = {setIsRenameOverlayEnabled}/>
    </View>
}
//The Note containing menu
const Menu = ({notes, setNotes, currentNote, setCurrentNote}) => {
    return <View style = {styles.leftMenuBar}>
        <TouchableOpacity style = {styles.leftMenuButton} disabled = {true}><Text style = {[styles.leftMenuTitle, styles.leftMenuText]}>Notes</Text></TouchableOpacity>
        <FlatList data={notes} renderItem = {({item}) => <TouchableOpacity style = {styles.leftMenuButton} onPress = {() => {setCurrentNote(item.id)}}><Text  style = {styles.leftMenuText} >{item.name}</Text></TouchableOpacity>}/>
        <TouchableOpacity style = {styles.leftMenuButton} onPress={() => {newNote(notes, setNotes)}}><Text style = {styles.leftMenuText}>Add new note</Text></TouchableOpacity>
        <TouchableOpacity style = {styles.leftMenuButton} onPress={() => {getNotes(setNotes)}}><Text style = {styles.leftMenuText}>Load notes</Text></TouchableOpacity>
        <TouchableOpacity style = {styles.leftMenuButton} onPress={() => {saveNotes(notes)}}><Text style = {styles.leftMenuText}>Save notes</Text></TouchableOpacity>
    </View>
}
const NoteView = ({toggleMenu, menuEnabled, currentNote, notes, setNotes, setIsRenameOverlayEnabled, setCurrentNote}) => {
    let value = "";
    if (notes.length != 0){value = notes[currentNote].content}
    return <View style = {styles.noteViewArea}>
        <View style = {styles.topMenuBar}>
            <TouchableOpacity style = {styles.topMenuButton} onPress={() => {toggleMenu(!menuEnabled)}}><Image style = {styles.topMenuImage} source={require("./assets/menu-button.png")}/></TouchableOpacity>
            <TouchableOpacity style = {styles.topMenuButton} onPress={() => {deleteNote(notes, setNotes, currentNote, setCurrentNote)}}><Image style = {styles.topMenuImage} source={require("./assets/delete-button.png")}/></TouchableOpacity>
            <TouchableOpacity style = {styles.topMenuButton} onPress={() => {setIsRenameOverlayEnabled(true)}}><Image style = {styles.topMenuImage} source={require("./assets/rename-button.png")}/></TouchableOpacity>
        </View> 
        <View style = {styles.noteTextArea}>
            <TextInput placeholder="Empty Note" value={value} style = {styles.noteTextInput} multiline = {true} onChangeText={(newText) => {onChangeText(newText, currentNote, notes, setNotes)}}/>
        </View>
    </View>
}
const RenameOverlay = ({setIsEnabled, notes, setNotes, currentNoteIndex}) => {
    const [newTitle, setNewTitle] = useState("Unnamed Note");
    let placeholder = "New Note";
    if (notes.length != 0){
        placeholder = notes[currentNoteIndex].name;
    }
    return <Modal transparent = {true}>
        <View style = {styles.renameOverlayScreen}>
            <View style = {styles.renameOverlay}>
                <Text>Rename note</Text>
                <TextInput placeholder={placeholder} onChangeText = {(text) => {setNewTitle(text)}}/>
                <View style = {styles.renameButtons}>
                    <Button onPress = {() => {renameNote(notes, setNotes, currentNoteIndex, newTitle); setIsEnabled(false)}} title="Save"/>
                    <Button title="Cancel" onPress={() => {setIsEnabled(false)}}/>
                </View>
            </View>
        </View>
    </Modal>
}
const renameNote = (
    notes : {name: string;content: string;id: number;selected: boolean;}[], 
    setNotes : React.Dispatch<React.SetStateAction<{name : string, content : string, id : number}[]>>,
    currentNote : number,
    newTitle : string,
) => {
    if (notes.length == 0){
        return;
    }
    let newNotes = [...notes];
    newNotes[currentNote].name = newTitle;
    setNotes(newNotes);
    saveNotes(notes);
}
const onChangeText = (newText : string, currentNote : number, notes : {name: string;content: string;id: number;selected: boolean;}[], setNotes : React.Dispatch<React.SetStateAction<{name : string, content : string, id : number}[]>>) => {
    if (notes.length == 0){newNote(notes, setNotes); return}
    let newNotes = [...notes];
    newNotes[currentNote].content = newText;
    saveNotes(newNotes);
    setNotes(newNotes);
}
const newNote = (notes : {name : string, content : string, id : number, selected : boolean}[], setNotes : React.Dispatch<React.SetStateAction<{name : string, content : string, id : number}[]>>) => {
    let id = 0;
    let currentNotes = notes;
    if (currentNotes.length!=0){id = currentNotes[currentNotes.length-1].id+1};
    currentNotes.push({name : "New Note", content : "", id, selected : false});
    setNotes(currentNotes);
}
const getNotes = async (updateNotes : React.Dispatch<React.SetStateAction<{name : string, content : string, id : number, selected : boolean}[]>>) => {
    let storedData = AsyncStorage.getItem('@notes');
    storedData.then((data) => {
        if (data != null){
            let parsedData = JSON.parse(data);
            updateNotes(parsedData);
        }
    })
}
const deleteNote = (notes  : {name : string, content : string, id : number, selected : boolean}[], setNotes : React.Dispatch<React.SetStateAction<{name : string, content : string, id : number}[]>>, index : number, setCurrentNote : React.Dispatch<React.SetStateAction<number>>) => {
    let newNotes = [...notes];
    newNotes.splice(index, 1);
    for (let i = 0; i < newNotes.length; i++){
        newNotes[i].id = i;
    }
    if (index >= newNotes.length){setCurrentNote(0)}
    setNotes(newNotes);
}
const saveNotes = async (notes : {name : string, content : string, id : number, selected : boolean}[]) => {
    let stringifiedData = JSON.stringify(notes);
    AsyncStorage.setItem('@notes', stringifiedData).then(() => {});
}
const styles = StyleSheet.create({
    //The entire app
    container : {
        flex : 1,
        flexDirection : "row",
        margin :16,
    },
    //The left menu containing the notes
    leftMenuBar : {
        flex : 3,
        marginRight : 16,
    },
    leftMenuTitle : {
        backgroundColor : "#eee",
        height : 30,
        marginBottom : 4,
        textAlign : "center",
        justifyContent : "center",
        textAlignVertical : "center",
        fontSize : 24,
    },
    //The individual buttons on the left menu bar
    leftMenuButton : {
        backgroundColor : "#eee",
        height : 30,
        marginBottom : 4,
        marginTop : 2,
        textAlign : "center",
        justifyContent : "center",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fff',
    },
    leftMenuText : {
        textAlignVertical : "center"
    },
    //The top bar with the action buttons
    topMenuBar : {
        flex : 1,
        flexDirection : "row",
    },
    //The buttons of the top bar
    topMenuButton : {
        width : 64,
        height : 64,
    },
    //The images of the top bar (nested within topMenuButton)
    topMenuImage : {
        width : 64,
        height : 64,
    },
    //View surrounding the note text field
    noteTextArea : {
        flex : 8,
    },
    //The actual text field
    noteTextInput : {
        width : "100%",
        height : "100%",
    },
    //The top bar and the text input area
    noteViewArea : {
        flex : 8,
    },
    renameOverlayScreen : {
        backgroundColor : "rgba(0,0,0,0.2)",
        flex : 1,
        justifyContent : "center",
        alignItems : "center"
    },
    renameOverlay : {
        backgroundColor : "#fff",
        width : "50%",
        height : "50%",
        alignItems : "center",
        justifyContent : "space-around",
    },
    renameButtons : {
        flex : 1,
        flexDirection : "row",
        marginLeft : 10,
        marginRight : 10,
        maxHeight : 30,
    },
});
export default App;