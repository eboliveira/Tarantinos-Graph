import itertools
import util
import pymongo


mongo = pymongo.MongoClient('localhost', 27017)
mongo.drop_database("Graph")
db = mongo.Graph

f = open('csv_sources/Films.csv', 'rb')
Films = util.format_csv(f)
FilmsVertexs = util.FilmsToObjs(Films)
util.insertFilmsInDb(FilmsVertexs, db)

f = open('csv_sources/Actors.csv', 'rb')
Actors = util.format_csv(f)
ActorsVertexs = util.actorsToObjs(Actors)
util.insertActorsInDb(ActorsVertexs, db)

f = open('csv_sources/Characters.csv', 'rb')
Characters = util.format_csv(f)
CharactersVertexs = util.charactersToObjs(Characters)
util.insertCharactersInDb(CharactersVertexs, db)

f = open('csv_sources/Brands.csv', 'rb')
Brands = util.format_csv(f)
BrandsVertexs = util.brandsToObjs(Brands)
util.insertBrandsInDb(BrandsVertexs, db)


mongo.close