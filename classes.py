import itertools


class Vertex(object):
    newid = itertools.count().next
    def __init__(self, characteristics):
        self.id = Vertex.newid()
        self.vType = None
        self.adjacents = {}
        self.characteristics = characteristics

    def printActors(self):
        for item in self.adjacents['Actor']:
            print item.characteristics

    def printCharacters(self):
        for item in self.adjacents['Character']:
            print item.characteristics

class Film(Vertex):
    def __init__(self, characteristics):
        super(Film, self).__init__(characteristics)
        self.adjacents['Character'] = []
        self.adjacents['Actor'] = []
        self.vType = "Film"

class Actor(Vertex):
    def __init__(self, characteristics):
        super(Actor, self).__init__(characteristics)
        self.adjacents['Film'] = []
        self.adjacents['Character'] = []
        self.vType = "Actor"
    
    def printFilms(self):
        for item in self.adjacents['Film']:
            print item.characteristics

class Character(Vertex):
    def __init__(self, characteristics):
        super(Character, self).__init__(characteristics)
        self.adjacents['Film'] = []
        self.adjacents['Actor'] = []
        self.adjacents['Character'] = []
        self.vType = "Character"

    def printFilms(self):
        for item in self.adjacents['Film']:
            print item.characteristics

class Brand(Vertex):
    def __init__(self, characteristics):
        super(Brand, self).__init__(characteristics)
        self.adjacents['Film'] = []
        self.adjacents['Actor'] = []
        self.adjacents['Character'] = []
        self.vType = "Brand"


class Graph(object):
    def __init__(self, vertexList):
        self.vertexList = vertexList
    
    def getVertex(self, key, value, vertexType = None):
        for item in self.vertexList:
            if vertexType == None:
                if item.characteristics[key] == value:
                    return item
            else:
                if item.vType is vertexType:
                    if item.characteristics[key] == value:
                        return item
    
    def addEgde(self, node1, node2):
        node1.adjacents[node2.vType].append(node2)
        node2.adjacents[node1.vType].append(node1)

    def printGraph(self):
        for item in self.vertexList:
            print item.characteristics
            print item.vType
            print item.adjacents
            print "\n"


