import classes
import pymongo
import util
import operator


mongo = pymongo.MongoClient('localhost', 27017)
db = mongo.Graph

Actors = db.Actors.find({},{"_id" : 0})
Vertexs = []
for item in Actors:
    Vertexs.append(classes.Actor(item))

Characters = db.Characters.find({},{"_id" : 0})
for item in Characters:
    Vertexs.append(classes.Character(item))

Films = db.Films.find({},{"_id" : 0})
for item in Films:
    Vertexs.append(classes.Film(item))

graph = classes.Graph(Vertexs)

f = open('csv_sources/filmsXactors.csv','rb')
filmsXactors = util.format_csv(f)
for item in filmsXactors:
    for j in range(1,len(item)):
        graph.addEgde(graph.getVertex('name',item[0]),graph.getVertex('name',item[j]))

f = open('csv_sources/filmsXcharacters.csv','rb')
filmsXcharacters = util.format_csv(f)
for item in filmsXcharacters:
    for j in range(1,len(item)):
        graph.addEgde(graph.getVertex('name',item[0]),graph.getVertex('name',item[j]))

f = open('csv_sources/charactersXactors.csv','rb')
charactersXactors = util.format_csv(f)
for item in charactersXactors:
    graph.addEgde(graph.getVertex('name',item[0],"Character"),graph.getVertex('name',item[1]))

actors = []
for item in graph.vertexList:
    if item.vType == 'Actor':
        actors.append(item)

actorsLens = []
for item in actors:
    actorsLens.append({'obj':item, 'len' : str(len(item.adjacents['Film']))})


actorsLens.sort(key = operator.itemgetter('len'), reverse = 1)
for item in actorsLens:
    print (item['obj'].characteristics['name'] + '\t\t\t\tFilmes feitos:' + item['len'])
