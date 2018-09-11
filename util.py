import classes

def format_csv(file):
    spam = file.readlines()
    for i in range(len(spam)):
        spam[i] = spam[i].replace("\n", "")
        spam[i] = spam[i].split(",")
    return spam

def FilmsToObjs(films):
    CharacSize = len(films[0])
    stamps = films.pop(0)
    vertexList = []
    for i in films:
        temp = {}
        for j in range(CharacSize):
            temp[stamps[j]] = i[j]
        vertexList.append(classes.Film(temp))
    return vertexList
    
def actorsToObjs(actors):
    CharacSize = len(actors[0])
    stamps = actors.pop(0)
    vertexList = []
    for i in actors:
        temp = {}
        for j in range(CharacSize):
            temp[stamps[j]] = i[j]
        vertexList.append(classes.Film(temp))
    return vertexList

def charactersToObjs(characters):
    CharacSize = len(characters[0])
    stamps = characters.pop(0)
    vertexList = []
    for i in characters:
        temp = {}
        for j in range(CharacSize):
            temp[stamps[j]] = i[j]
        vertexList.append(classes.Film(temp))
    return vertexList

def brandsToObjs(brands):
    CharacSize = len(brands[0])
    stamps = brands.pop(0)
    vertexList = []
    for i in brands:
        temp = {}
        for j in range(CharacSize):
            temp[stamps[j]] = i[j]
        vertexList.append(classes.Brand(temp))
    return vertexList

def insertFilmsInDb(filmsVertexs, db):
    for i in filmsVertexs:
        db.Films.insert_one(i.characteristics)

def insertActorsInDb(ActorsVertexs, db):
    for i in ActorsVertexs:
        db.Actors.insert_one(i.characteristics)

def insertCharactersInDb(CharactersVertexs, db):
    for i in CharactersVertexs:
        db.Characters.insert_one(i.characteristics)

def insertBrandsInDb(BrandsVertexs, db):
    for i in BrandsVertexs:
        db.Brands.insert_one(i.characteristics)


    