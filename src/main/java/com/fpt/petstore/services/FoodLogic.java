/**
 *
 */
package com.fpt.petstore.services;

import com.fpt.petstore.entities.Food;
import com.fpt.petstore.entities.Food.FoodType;
import com.fpt.petstore.repository.FoodRepository;
import com.fpt.petstore.util.DateUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;


/**
 * @author linuss
 */

@Component
public class FoodLogic {

  @Autowired
  FoodRepository repo;

  public Food saveFood(Food food) {
    return repo.save(food);
  }

  public Food getFoodByCode(String code) {
    return repo.getByCode(code);
  }

  public List<Food> findFoodByType(FoodType foodType) {
    return repo.findByType(foodType);
  }

  public List<Food> findAllFoods() {
    return (List<Food>) repo.findAll();
  }

  public Food getFoodbySortName(String sortName){
    return repo.getbySortName(sortName);
  }
  public boolean deleteFoodById(Long id) {
    repo.deleteById(id);
    return true;
  }

  public boolean deleteFoods(List<Food> foods) {
    for (Food sel : foods) {
      deleteFoodById(sel.getId());
    }
    return true;
  }

  public Integer countFood(){
    return repo.countFood();
  }

  public Page<Food> listFoodbyPage(Pageable pageable) {
    return repo.listFoodbyPage(pageable);
  }
  public Food findbyId(long id){
    return repo.findById(id);
  }
  public List<Food> findFoodbyName(String name){
    return  repo.findfoodByName(name);
  }
  public List<Food> findFoodbyPrice(long price){
    return repo.findByPrice(price);
  }

}
